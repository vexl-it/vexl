import React from 'react'
import {styled} from 'tamagui'

import {YStack} from '../primitives'
import {Typography} from './Typography'

export const InfoList = styled(YStack, {
  name: 'InfoList',
  backgroundColor: '$backgroundSecondary',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  borderRadius: '$5',
})

export interface InfoListItemProps {
  readonly title: string
  readonly note?: string
}

export function InfoListItem({
  title,
  note,
}: InfoListItemProps): React.JSX.Element {
  return (
    <YStack paddingVertical="$3" gap="$1">
      <Typography color="$foregroundPrimary" variant="paragraph">
        {title}
      </Typography>
      {note ? (
        <Typography color="$foregroundSecondary" variant="micro">
          {note}
        </Typography>
      ) : null}
    </YStack>
  )
}
