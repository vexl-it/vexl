import {hmac} from '@vexl-next/cryptography'
import type * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import React, {useCallback, useState} from 'react'
import {Text, YStack} from 'tamagui'
import formatNumber from '../../../utils/formatNumber'
import sequenceTasksWithAnimationFrames from '../../../utils/sequenceTasksWithAnimationFrames'
import Button from '../../Button'
import ProgressBar from '../../ProgressBar'

// sleep promise
function sleepPromise(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

function createIntensiveTasks(
  onProgress: (progress: number) => void = () => {}
): Array<T.Task<string>> {
  return Array(10000)
    .fill('ahojTotojetest')
    .map((input, i, array) => {
      return async () => {
        const result = hmac.hmacSign({
          data: input,
          password: 'ahoj',
        })
        onProgress((i + 1) / array.length)
        return result
      }
    })
}

export default function AfterInteractionTaskDemo(): React.ReactElement {
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | undefined>(undefined)

  const runTask = useCallback(() => {
    void (async () => {
      setProgress(0)
      setResult(undefined)
      await sleepPromise(1000)
      const startAt = Date.now()
      const result = await pipe(
        createIntensiveTasks(),
        sequenceTasksWithAnimationFrames(500, (progress) => {
          setProgress(progress)
        })
      )()
      setResult(
        `Done. Got ${result.length} items. Took ${formatNumber(
          Date.now() - startAt
        )}ms`
      )
    })()
  }, [])

  return (
    <YStack gap="$2" my="$2">
      <Text color="$black">
        Test extensive calculation that updates UI. (Calculating 2000 hmacs)
      </Text>
      <Button
        size="small"
        variant="secondary"
        text="run"
        onPress={runTask}
      ></Button>
      <ProgressBar percentDone={progress * 100} />
      {!result ? (
        <Text color="$black">{Math.round(progress * 100)}</Text>
      ) : (
        <Text color="$black">{result}</Text>
      )}
    </YStack>
  )
}
