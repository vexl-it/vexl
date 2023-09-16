import Sound from 'react-native-sound'

export async function playSmartUndCreamySound(): Promise<void> {
  Sound.setCategory('Playback')

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sound = new Sound(require('./assets/audio.mp3'), () => {
    sound.play(() => {
      sound.release()
    })
  })
}
