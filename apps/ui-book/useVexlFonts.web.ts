import {getVexlFontFaceCss} from '@vexl-next/ui'
import {Asset} from 'expo-asset'
import {useEffect} from 'react'

export function useVexlFonts(): boolean {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = getVexlFontFaceCss(
      ({source}) => Asset.fromModule(source).uri
    )
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [])

  return true
}
