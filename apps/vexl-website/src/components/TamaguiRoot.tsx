'use client'

import {config, getVexlFontFaceCss, YStack} from '@vexl-next/ui'
import {useServerInsertedHTML} from 'next/navigation'
import React from 'react'
import {StyleSheet} from 'react-native-web'
import {TamaguiProvider} from 'tamagui'

// The bundler emits each font file and replaces its require() with the file URL.
const fontFaceCss = getVexlFontFaceCss(({source}) => String(source))

export function TamaguiRoot({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
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
