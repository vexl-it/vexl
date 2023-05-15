import Button from './Button'
import {Stack} from 'tamagui'

export interface TabProps<T> {
  title: string
  type: T
}

interface Props<T> {
  activeTab: T | undefined
  onTabPress: (_: T) => void
  tabs: Array<TabProps<T>>
}

function Tabs<T>({activeTab, onTabPress, tabs}: Props<T>): JSX.Element {
  return (
    <Stack fd="row" ai="center" br="$4" bg="$grey" p="$1">
      {tabs.map((tab) => (
        <Button
          key={tab.title}
          fullSize
          variant={activeTab === tab.type ? 'primary' : 'blackOnDark'}
          text={tab.title}
          onPress={() => {
            onTabPress(tab.type)
          }}
        />
      ))}
    </Stack>
  )
}

export default Tabs
