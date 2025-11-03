import Clipboard from '@react-native-clipboard/clipboard'
import {useAtom, useAtomValue, useSetAtom, useStore} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import {
  benchmarkArrayAtom,
  benchmarkAtom,
  benchmarkEnabledAtom,
  clearBenchmarksActionAtom,
} from '../../../state/ActionBenchmarks'
import Button from '../../Button'
import Switch from '../../Switch'

function BenchmarksList(): React.ReactElement {
  const benchmarks = useAtomValue(benchmarkArrayAtom)

  return (
    <YStack>
      {benchmarks.map((benchmark) => (
        <YStack key={benchmark.name}>
          <Text color="$black">{benchmark.name}</Text>
          <YStack>
            {benchmark.records.map((record, index) => (
              <XStack key={index} justifyContent="space-between">
                <Text
                  color={
                    record.endedAt - record.startedAt > 1000 ? '$red' : '$black'
                  }
                >
                  Duration: {record.endedAt - record.startedAt} ms
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      ))}
    </YStack>
  )
}

export function ActionBenchmarks(): React.ReactElement {
  const [benchmarkEnabled, setBenchmarkEnabled] = useAtom(benchmarkEnabledAtom)
  const clearBenchmarks = useSetAtom(clearBenchmarksActionAtom)
  const store = useStore()
  return (
    <YStack space="$2">
      <XStack>
        <Text color="$black">Action Benchmarks</Text>
        <Switch
          value={benchmarkEnabled}
          onValueChange={(newValue) => {
            setBenchmarkEnabled(newValue)
          }}
        />
      </XStack>
      <BenchmarksList />
      <Button
        variant="primary"
        size="small"
        text="clear"
        onPress={() => {
          clearBenchmarks()
        }}
      />
      <Button
        variant="primary"
        size="small"
        text="Copy json"
        onPress={() => {
          Clipboard.setString(JSON.stringify(store.get(benchmarkAtom), null, 2))
        }}
      />
    </YStack>
  )
}
