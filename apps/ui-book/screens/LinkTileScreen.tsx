import {Download, LinkTile, XStack} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'
import {useTheme} from 'tamagui'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const theme = useTheme()
  return (
    <>
      <DemoSection title="Label only">
        <XStack>
          <LinkTile
            label="Obtainium"
            onPress={() => {
              Alert.alert('Pressed', 'Obtainium')
            }}
          />
        </XStack>
      </DemoSection>

      <DemoSection title="With leading icon, wrapping row">
        <XStack gap="$3" flexWrap="wrap">
          <LinkTile
            label="GitHub Releases (APK)"
            leading={
              <Download size={20} color={theme.foregroundPrimary.get()} />
            }
          />
          <LinkTile
            label="Zapstore"
            leading={
              <Download size={20} color={theme.foregroundPrimary.get()} />
            }
          />
        </XStack>
      </DemoSection>
    </>
  )
}

export function LinkTileScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Link Tile" demos={Demos} />
}
