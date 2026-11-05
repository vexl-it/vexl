import {RefreshControl, Typography, YStack} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {ScrollView} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const REFRESH_DURATION_MS = 1500

function Demos(): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      setRefreshCount((count) => count + 1)
    }, REFRESH_DURATION_MS)
  }, [])

  return (
    <YStack
      height={200}
      borderRadius="$4"
      overflow="hidden"
      backgroundColor="$backgroundSecondary"
    >
      <ScrollView
        nestedScrollEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <YStack padding="$4" gap="$3" minHeight={240}>
          <Typography variant="paragraph" color="$foregroundPrimary">
            Pull down to refresh
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            Refreshed {refreshCount} times
          </Typography>
        </YStack>
      </ScrollView>
    </YStack>
  )
}

export function RefreshControlScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Refresh Control" demos={Demos} />
}
