import {Typography} from '@vexl-next/ui'
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {getMessagePreviewText} from '../utils/getMessagePreviewText'

function BaseText({
  children,
  unread,
  color,
  ...rest
}: {
  children: string
  unread: boolean
  color?: React.ComponentProps<typeof Typography>['color']
} & Omit<
  React.ComponentProps<typeof Typography>,
  'children' | 'color' | 'variant'
>): React.ReactElement {
  return (
    <Typography
      variant="description"
      color={color ?? (unread ? '$foregroundPrimary' : '$foregroundSecondary')}
      {...rest}
    >
      {children}
    </Typography>
  )
}

function MessagePreview({
  lastMessageAtom,
  unread,
  name,
  ...rest
}: {
  lastMessageAtom: Atom<ChatMessageWithState>
  unread: boolean
  name: string
} & Omit<
  React.ComponentProps<typeof Typography>,
  'children' | 'color' | 'variant'
>): React.ReactElement | null {
  const {t} = useTranslation()

  const messageWithState = useAtomValue(lastMessageAtom)
  const preview = getMessagePreviewText({messageWithState, name, t})

  return (
    <BaseText unread={unread} color={preview.color} {...rest}>
      {preview.text}
    </BaseText>
  )
}

export default MessagePreview
