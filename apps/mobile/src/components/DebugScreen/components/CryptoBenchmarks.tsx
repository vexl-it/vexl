import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/src/implementations/ecdhComputeSecret'
import {computeSharedSecret} from '@vexl-next/react-native-ecdh-platform-native-utils'
import React, {useEffect, useState} from 'react'
import {Platform} from 'react-native'
import {Text, YStack} from 'tamagui'
import Button from '../../Button'
import {
  NUMBER_OF_GENERATIONS,
  runBenchmark,
  runTests,
  simulateEncrypting5000Offers,
} from '../utils'

function createDummyImplementation(
  msDelay: number
): typeof defaultImplementation {
  return async () => {
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          publicKey: Buffer.from('aha'),
          secret: Buffer.from('ehe'),
        })
      }, msDelay)
    })
  }
}

const dummy0Implementation = createDummyImplementation(0)
const dummy10Implementation = createDummyImplementation(10)

// setEcdhComputeSecretImplementation(createDummyImplementation(2))

export default function CryptoBenchmarks(): React.ReactElement {
  const [text, setText] = useState('Not started yet')

  function addText(text: string): void {
    setText((prev) => `${prev}\n${text}`)
  }

  useEffect(() => {
    return () => {
      setEcdhComputeSecretImplementation(
        Platform.OS === 'ios' ? defaultImplementation : computeSharedSecret
      )
    }
  }, [])

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async function printGenerator(
    generator: AsyncGenerator<string, any, unknown>
  ) {
    setText('')
    let curr = await generator.next()

    while (!curr.done) {
      addText(curr.value)
      curr = await generator.next()
    }
  }

  return (
    <YStack gap="$2">
      <Text fos={20} color="$black">
        For each crypto operation, we run {NUMBER_OF_GENERATIONS} iterations and
        measure the time
      </Text>
      <Text col="$black">{text}</Text>
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          setText('')
          const generator = runBenchmark()
          await printGenerator(generator)
        }}
        variant="secondary"
        text="Run benchmark"
        size="small"
      />
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          setText('')
          const generator = runTests()
          await printGenerator(generator)
        }}
        variant="secondary"
        text="Run tests"
        size="small"
      />
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          setText('')
          const generator = simulateEncrypting5000Offers()
          await printGenerator(generator)
        }}
        variant="secondary"
        text="Run 5000 offers encryption"
        size="small"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(defaultImplementation)
        }}
        variant="primary"
        size="small"
        text="set pure JS implementation"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(dummy10Implementation)
        }}
        variant="primary"
        size="small"
        text="set 10ms implementation"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(dummy0Implementation)
        }}
        variant="primary"
        size="small"
        text="set instant implementation"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(computeSharedSecret)
        }}
        variant="primary"
        size="small"
        text="set android native implementation"
      />
    </YStack>
  )
}
