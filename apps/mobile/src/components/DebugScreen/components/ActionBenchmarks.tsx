import Clipboard from '@react-native-clipboard/clipboard'
import {Button, Switch, Typography, XStack, YStack} from '@vexl-next/ui'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {
  benchmarkArrayAtom,
  benchmarkAtom,
  benchmarkEnabledAtom,
  clearBenchmarksActionAtom,
} from '../../../state/ActionBenchmarks'

function BenchmarksList(): React.ReactElement {
  const benchmarks = useAtomValue(benchmarkArrayAtom)

  return (
    <YStack>
      {benchmarks.map((benchmark) => (
        <YStack key={benchmark.name}>
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {benchmark.name}
          </Typography>
          <YStack>
            {benchmark.records.map((record, index) => (
              <XStack key={index} justifyContent="space-between">
                <Typography
                  variant="description"
                  color={
                    record.endedAt - record.startedAt > 1000
                      ? '$redAccent1'
                      : '$foregroundPrimary'
                  }
                >
                  Duration: {record.endedAt - record.startedAt} ms
                </Typography>
              </XStack>
            ))}
          </YStack>
        </YStack>
      ))}
    </YStack>
  )
}

export function ActionBenchmarks(): React.ReactElement {
  const clearBenchmarks = useSetAtom(clearBenchmarksActionAtom)
  const store = useStore()
  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          Action Benchmarks
        </Typography>
        <Switch valueAtom={benchmarkEnabledAtom} />
      </XStack>
      <BenchmarksList />
      <Button
        variant="primary"
        size="small"
        onPress={() => {
          clearBenchmarks()
        }}
      >
        clear
      </Button>
      <Button
        variant="primary"
        size="small"
        onPress={() => {
          Clipboard.setString(JSON.stringify(store.get(benchmarkAtom), null, 2))
        }}
      >
        Copy json
      </Button>
    </YStack>
  )
}
