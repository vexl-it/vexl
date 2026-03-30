import {Button} from '@vexl-next/ui'
import React from 'react'
import {RefreshControl, ScrollView} from 'react-native'
import {Stack, YStack, getTokens} from 'tamagui'
import usePixelsFromBottomWhereTabsEnd from './InsideRouter/utils'

interface ContentProps {
  buttonText?: string | undefined
  children: React.ReactNode
  onButtonPress?: () => void
}

function EmptyListContent({
  children,
  buttonText,
  onButtonPress,
}: ContentProps): React.ReactElement {
  return (
    <YStack jc="center" gap="$5">
      {children}
      {!!buttonText && !!onButtonPress && (
        <Button variant="tertiary" size="small" onPress={onButtonPress}>
          {buttonText}
        </Button>
      )}
    </YStack>
  )
}

interface Props extends ContentProps {
  inScrollView?: boolean
  refreshing?: boolean | undefined
  onRefresh?: () => void
}

function EmptyListWrapper({
  buttonText,
  children,
  inScrollView,
  onButtonPress,
  refreshing = false,
  onRefresh,
}: Props): React.ReactElement {
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return inScrollView ? (
    <ScrollView
      indicatorStyle="white"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={getTokens().color.greyAccent5.val}
          />
        ) : undefined
      }
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: tabBarEndsAt,
      }}
    >
      <EmptyListContent buttonText={buttonText} onButtonPress={onButtonPress}>
        {children}
      </EmptyListContent>
    </ScrollView>
  ) : (
    <Stack ai="center" jc="center">
      <EmptyListContent buttonText={buttonText} onButtonPress={onButtonPress}>
        {children}
      </EmptyListContent>
    </Stack>
  )
}

export default EmptyListWrapper
