import {TouchableOpacity} from 'react-native'
import {Stack, XStack} from 'tamagui'
import TabTitle from './TabTitle'

export interface TabProps<T> {
  testID?: string
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
    <XStack ai="center" br="$5" bg="$grey" p="$1" gap="$1">
      {tabs.map((tab) => (
        <TouchableOpacity
          testID={tab.testID}
          key={tab.title}
          style={{flex: 1}}
          onPress={() => {
            onTabPress(tab.type)
          }}
        >
          <Stack
            ai="center"
            bc={activeTab === tab.type ? '$yellowAccent2' : 'transparent'}
            jc="center"
            px="$2"
            py="$5"
            br="$4"
          >
            <TabTitle
              active={activeTab === tab.type}
              fontSize={20}
              title={tab.title}
              numberOfLines={2}
              ff="$body600"
            />
          </Stack>
        </TouchableOpacity>
      ))}
    </XStack>
  )
}

export default Tabs
