import { wikiLinks } from 'components/settings/SettingsBar'
import { SimpleToggleField } from 'components/SimpleToggleField'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config } from 'utils/config/helper'
import { Option, SelectInput } from '../SelectInput'
import { Field } from './Field'
import { SettingsSection } from './SettingsSection'

const iconOptions: Option<Config['icons']>[] = [
  {
    key: 'rich',
    value: 'rich',
    label: `VSCode icons`,
  },
  {
    key: 'dim',
    value: 'dim',
    label: `VSCode icons (single color)`,
  },
  {
    key: 'native',
    value: 'native',
    label: `GitHub icons`,
  },
]

const recursiveToggleFolderOptions: Option<Config['recursiveToggleFolder']>[] = [
  {
    key: 'shift',
    value: 'shift',
    label: `⇧(shift)`,
  },
  {
    key: 'alt',
    value: 'alt',
    label: `⌥(alt)`,
  },
]

type Props = {}

export function FileTreeSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  return (
    <SettingsSection title={'File Tree'}>
      <Field id="recursive-toggle-folder" title="Toggle folders recursively while holding">
        <SelectInput
          id="recursive-toggle-folder"
          options={recursiveToggleFolderOptions}
          onChange={v => {
            configContext.onChange({
              recursiveToggleFolder: v,
            })
          }}
          value={configContext.value.recursiveToggleFolder}
        />
      </Field>
      <Field title="Icons" id="file-tree-icons">
        <SelectInput<Config['icons']>
          id="file-tree-icons"
          options={iconOptions}
          onChange={v => {
            configContext.onChange({
              icons: v,
            })
          }}
          value={configContext.value.icons}
        />
      </Field>
      <SimpleToggleField
        field={{
          key: 'compressSingletonFolder',
          label: 'Compress singleton folder',
          wikiLink: wikiLinks.compressSingletonFolder,
          tooltip: 'Merge folders and their only child folder to make UI more compact.',
        }}
      />
      <SimpleToggleField
        field={{
          key: 'restoreExpandedFolders',
          label: 'Restore expanded folders',
          tooltip: 'Folders will be expanded again when clear search input',
        }}
      />
      <SimpleToggleField
        field={{
          key: 'commentToggle',
          label: 'Show PR file comments',
          tooltip: 'Show number of comments next to file names in Pull Requests.',
        }}
      />
      <SimpleToggleField
        field={{
          key: 'compactFileTree',
          label: 'Compact file tree layout',
          tooltip: 'View file tree structures more effectively.',
        }}
      />
    </SettingsSection>
  )
}
