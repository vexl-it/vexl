'use client'

import {config, getVexlFontFaceCss, YStack} from '@vexl-next/ui'
import {useServerInsertedHTML} from 'next/navigation'
import React, {useEffect} from 'react'
import {StyleSheet} from 'react-native-web'
import {TamaguiProvider} from 'tamagui'

// The bundler emits each font file and replaces its require() with the file URL.
const fontFaceCss = getVexlFontFaceCss(({source}) => String(source))

/**
 * Tamagui renders pressables as `div role="button"`, which only react to
 * clicks. Enter and Space press them here, the way they press a <button>.
 */
function useKeyboardPressForRoleButtons(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
      const target = event.target
      if (
        !(target instanceof HTMLElement) ||
        target.tagName === 'BUTTON' ||
        target.getAttribute('role') !== 'button'
      )
        return
      event.preventDefault()
      target.click()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}

export function TamaguiRoot({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  useKeyboardPressForRoleButtons()
  useServerInsertedHTML(() => {
    const reactNativeWebSheet = StyleSheet.getSheet()
    return (
      <>
        <style
          id={reactNativeWebSheet.id}
          dangerouslySetInnerHTML={{__html: reactNativeWebSheet.textContent}}
        />
        <style dangerouslySetInnerHTML={{__html: config.getNewCSS()}} />
      </>
    )
  })

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <style href="vexl-fonts" precedence="default">
        {fontFaceCss}
      </style>
      <YStack minHeight="100vh" backgroundColor="$backgroundPrimary">
        {children}
      </YStack>
    </TamaguiProvider>
  )
}
