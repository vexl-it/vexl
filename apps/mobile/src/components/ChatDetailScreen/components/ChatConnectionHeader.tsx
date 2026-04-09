import {
  IconTag,
  PeopleUsers,
  TextTag,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {getTokens, useTheme} from 'tamagui'
import UserAvatar from '../../UserAvatar'

export interface TradeTagData {
  readonly iconVariant: 'bitcoin' | 'product' | 'service'
  readonly label: string
  readonly variant: 'offer' | 'request'
}

interface Props {
  readonly canSendMessages: boolean
  readonly commonConnectionsLabel: string
  readonly connectionTitle: string
  readonly otherSideLeft: boolean
  readonly tradeTag: TradeTagData | null
  readonly userImage: React.ComponentProps<typeof UserAvatar>['userImage']
}

export default function ChatConnectionHeader({
  canSendMessages,
  commonConnectionsLabel,
  connectionTitle,
  otherSideLeft,
  tradeTag,
  userImage,
}: Props): React.ReactElement {
  const theme = useTheme()

  const commonConnections = (
    <XStack alignItems="center" gap="$2">
      <PeopleUsers
        color={theme.foregroundSecondary.val}
        size={getTokens().size.$5.val}
      />
      <Typography color="$foregroundSecondary" variant="description">
        {commonConnectionsLabel}
      </Typography>
    </XStack>
  )

  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$4">
      <XStack alignItems="center" flex={1} gap="$3">
        <UserAvatar
          grayScale={otherSideLeft || !canSendMessages}
          userImage={userImage}
          width={40}
          height={40}
        />
        <YStack flex={1} gap="$2">
          <Typography color="$foregroundPrimary" variant="titlesSmall">
            {connectionTitle}
          </Typography>
          {commonConnections}
        </YStack>
      </XStack>
      {tradeTag ? (
        <XStack alignItems="center" gap="$2">
          <TextTag label={tradeTag.label} variant={tradeTag.variant} />
          <IconTag variant={tradeTag.iconVariant} />
        </XStack>
      ) : null}
    </XStack>
  )
}
