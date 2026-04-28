import {Button} from '@vexl-next/ui'
import React from 'react'
import {RefreshControl, ScrollView} from 'react-native'
import {Stack, YStack, getTokens} from 'tamagui'
import usePixelsFromBottomWhereTabsEnd from './InsideRouter/utils'

interface ContentProps {
  buttonText?: string | undefined
  children: React.ReactNode
  onButtonPress?: () => void
  horizontalPadding?: boolean
}

function EmptyListContent({
  children,
  buttonText,
  horizontalPadding,
  onButtonPress,
}: ContentProps): React.ReactElement {
  return (
    <YStack px={horizontalPadding ? '$5' : 0} jc="center" gap="$5">
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
  horizontalPadding?: boolean
}

function EmptyListWrapper({
  buttonText,
  children,
  inScrollView,
  onButtonPress,
  refreshing = false,
  onRefresh,
  horizontalPadding = false,
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
      <EmptyListContent
        horizontalPadding={horizontalPadding}
        buttonText={buttonText}
        onButtonPress={onButtonPress}
      >
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
