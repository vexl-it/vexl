import {useEffect, useState} from 'react'
import {Keyboard} from 'react-native'
export default function useIsKeyboardShown(): boolean {
  const [isKeyboardShown, setIsKeyboardShown] = useState(Keyboard.isVisible())

  useEffect(() => {
    const removeShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardShown(true)
    })
    const removeHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardShown(false)
    })
    return () => {
      removeShowListener.remove()
      removeHideListener.remove()
    }
  }, [setIsKeyboardShown])

  return isKeyboardShown
}
