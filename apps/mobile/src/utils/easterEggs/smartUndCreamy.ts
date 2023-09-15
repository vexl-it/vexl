import {Audio} from 'expo-av'
import {type SoundObject} from 'expo-av/build/Audio/Sound'

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function playSmartUndCreamySound(): Promise<void> {
  let soundObject: SoundObject['sound'] | undefined

  try {
    console.log('Loading Sound')
    soundObject = // eslint-disable-next-line @typescript-eslint/no-var-requires
      (await Audio.Sound.createAsync(require('./assets/audio.mp3'))).sound
    await soundObject?.playAsync()
    await sleep(5000)
  } catch (e) {
    // fail silently
  } finally {
    try {
      await soundObject?.unloadAsync()
    } catch (e) {
      /* silently fail */
    }
  }
}
