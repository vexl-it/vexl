import {useEffect, useState} from 'react'
import {Keyboard} from 'react-native'
export default function useWillKeyboardShow(): boolean {
  const [willKeyboardShow, setWillKeyboardShow] = useState(false)

  useEffect(() => {
    const removeShowListener = Keyboard.addListener('keyboardWillShow', () => {
      setWillKeyboardShow(true)
    })
    const removeHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setWillKeyboardShow(false)
    })
    return () => {
      removeShowListener.remove()
      removeHideListener.remove()
    }
  }, [setWillKeyboardShow])

  return willKeyboardShow
}
