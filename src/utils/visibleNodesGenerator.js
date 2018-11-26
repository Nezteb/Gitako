/**
 * This is the stack for generating an array of nodes for rendering
 *
 * when lower layer changes, higher layers would reset
 * when higher layer changes, lower layers would not notice
 *
 *  render stack                 | when will change         | on change callback
 *
 *  ^  changes frequently
 *  |
 *  |4 focus                     | when hover/focus move    | onFocusChange
 *  |                            |                          |   expandedNodes + focusNode -> visibleNodes
 *  |3 expansion                 | when fold/unfold         | onExpansionChange
 *  |                            |                          |   searchedNodes + toggleNode -> expandedNodes
 *  |2 search key                | when search              | onSearch
 *  |                            |                          |   treeNodes + searchKey -> searchedNodes
 *  |1 tree: { root <-> nodes }  | when tree init           | treeHelper.parse
 *  |                                                       |   tree data from api -> { root, nodes }
 *  v  stable
 */

const SEARCH_DELAY = 250

function getFilterFunc(keyRegex) {
  return function filterFunc({ name }) {
    return keyRegex.test(name)
  }
}

function filterDuplications(arr) {
  return Array.from(new Set(arr))
}

function search(treeNodes, searchKey) {
  if (!searchKey) return treeNodes
  /**
   * if searchKey is 'abcd'
   * then keyRegex will be /abcd/i and /a.*?b.*?c.*?d/i
   */
  const keyRegexes = [
    new RegExp(searchKey, 'i'),
    new RegExp(
      searchKey
        .replace(/\//, '')
        .split('')
        .join('.*?'),
      'i'
    ),
  ]
  const searchResults = [].concat(
    ...keyRegexes.map(keyRegex => treeNodes.filter(getFilterFunc(keyRegex)))
  )
  return filterDuplications(searchResults)
}

function debounce(func, delay) {
  let timer
  return (...args) => new Promise(resolve => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => resolve(func(...args)), delay)
  })
}

export const debouncedSearch = debounce(search, SEARCH_DELAY)

function getNodes(root, nodes = []) {
  if (!root.contents) return
  root.contents.forEach(node => {
    nodes.push(node)
    getNodes(node, nodes)
  })
  return nodes
}

function compressTree(root, prefix = []) {
  if (root.contents) {
    if (root.contents.length === 1) {
      const singleton = root.contents[0]
      if (singleton.type === 'tree') {
        return compressTree(singleton, [...prefix, root.name])
      }
    }
  }
  return {
    ...root,
    name: [...prefix, root.name].join('/'),
    contents: root.contents
      ? root.contents.map(node => compressTree(node))
      : undefined,
  }
}

export default class VisibleNodesGenerator {
  // LEVEL 1
  root = null
  nodes = null
  compressed = false

  getRoot() {
    return this.compress && this.compressed
      ? this.compressedRoot
      : this.root
  }

  async plantTree(root) {
    this.root = root
    this.nodes = getNodes(root)
    this.compressedRoot = compressTree(root)

    await this.search()
  }

  // LEVEL 2
  searchedNodes = null
  async search(searchKey) {
    this.compressed = !Boolean(searchKey)
    this.searchedNodes = searchKey
      ? await debouncedSearch(this.nodes, searchKey)
      : this.getRoot().contents

    this.expandedNodes.clear()
    this.generateVisibleNodes()
  }

  setCompress(compress) {
    this.compress = compress
  }

  // LEVEL 3
  expandedNodes = new Set()
  depths = new Map()
  toggleExpand(node) {
    this.setExpand(node, !this.expandedNodes.has(node))
  }

  setExpand(node, expand) {
    if (expand && node.contents) {
      // only node with contents is expandable
      this.expandedNodes.add(node)
    } else {
      this.expandedNodes.delete(node)
    }
    this.generateVisibleNodes()
  }

  expandTo(path) {
    let root = this.getRoot()
    const findNode = (root) => {
      if (path.indexOf(root.path) === 0) {
        if (root.path === path) return root
        this.setExpand(root, true)
        if (root.contents) {
          for (const content of root.contents) {
            const node = findNode(content)
            if (node) return node
          }
        }
      }
    }
    const node = findNode(root)
    if (node) {
      this.setExpand(node, true)
    }
    this.focusNode(node)
    return node
  }

  visibleNodes = null
  generateVisibleNodes() {
    this.focusedNode = null
    this.depths.clear()
    const nodesSet = new Set() // prevent duplication
    const nodes = [], stack = this.searchedNodes.slice().reverse()
    let current, depth = 0
    while (stack.length) {
      current = stack.pop()
      if (current === null) {
        depth -= 1
        continue
      }
      if (nodesSet.has(current)) continue
      nodes.push(current)
      nodesSet.add(current)
      this.depths.set(current, depth)
      if (this.expandedNodes.has(current)) {
        stack.push(null) // use null as pop depth flag
        stack.push(...current.contents.slice().reverse())
        depth += 1
      }
    }
    this.visibleNodes = {
      nodes,
      depths: this.depths,
      expandedNodes: this.expandedNodes,
    }
    this.focusNode(null)
  }

  // LEVEL 4
  focusedNode = null
  focusNode(node) {
    this.focusedNode = node
    this.visibleNodes = {
      ...this.visibleNodes,
      focusedNode: node,
    }
  }
}
