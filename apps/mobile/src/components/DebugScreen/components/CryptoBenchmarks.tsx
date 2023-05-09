import {Text, YStack} from 'tamagui'
import Button from '../../Button'
import {useEffect, useState} from 'react'
import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/dist/implementations/ecdhComputeSecret'
import {computeSharedSecret} from '@vexl-next/react-native-ecdh-platform-native-utils/src'
import {Platform} from 'react-native'
import {NUMBER_OF_GENERATIONS, runBenchmark, runTests} from '../utils'

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

// setEcdhComputeSecretImplementation(createDummyImplementation(2))

export default function CryptoBenchmarks(): JSX.Element {
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
    <YStack space={'$2'}>
      <Text fos={20} color={'$black'}>
        For each crypto operation, we run {NUMBER_OF_GENERATIONS} iterations and
        measure the time
      </Text>
      <Text>{text}</Text>
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          setText('')
          const generator = runBenchmark()
          await printGenerator(generator)
        }}
        variant={'secondary'}
        text={'Run benchmark'}
        small
      />
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          setText('')
          const generator = runTests()
          await printGenerator(generator)
        }}
        variant={'secondary'}
        text={'Run tests'}
        small
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(defaultImplementation)
        }}
        variant="primary"
        small
        text="set pure JS implementation"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(createDummyImplementation(10))
        }}
        variant="primary"
        small
        text="set 10ms implementation"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(createDummyImplementation(0))
        }}
        variant="primary"
        small
        text="set instant implementation"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(computeSharedSecret)
        }}
        variant="primary"
        small
        text="set android native implementation"
      />
    </YStack>
  )
}
