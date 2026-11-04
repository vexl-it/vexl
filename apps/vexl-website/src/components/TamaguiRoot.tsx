'use client'

import {config, YStack} from '@vexl-next/ui'
import {useServerInsertedHTML} from 'next/navigation'
import React from 'react'
import {StyleSheet} from 'react-native-web'
import {TamaguiProvider} from 'tamagui'

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
      <YStack minHeight="100vh" backgroundColor="$backgroundPrimary">
        {children}
      </YStack>
    </TamaguiProvider>
  )
}
