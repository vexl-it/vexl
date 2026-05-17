import {Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {chatMolecule} from '../atoms'
import formatChatTime from '../utils/formatChatTime'

export function LastMessageTime({
  message,
}: {
  message: ChatMessageWithState
}): React.ReactElement {
  const {t} = useTranslation()
  const {lastMessageReadByOtherSideAtAtom} = useMolecule(chatMolecule)

  const lastMessageReadByOtherSideAt = useAtomValue(
    lastMessageReadByOtherSideAtAtom
  )

  const isMine = message.state !== 'received'

  return (
    <Typography
      mx="$5"
      color={
        message.state === 'sendingError'
          ? '$redForeground'
          : '$foregroundTertiary'
      }
      variant="micro"
      textAlign={isMine ? 'right' : 'left'}
      marginTop="$3"
    >
      {message.state === 'sending' && t('messages.sending')}
      {message.state === 'sent' &&
        !!lastMessageReadByOtherSideAt &&
        t('messages.readAt', {
          time: formatChatTime(
            DateTime.fromMillis(lastMessageReadByOtherSideAt)
          ),
        })}
      {message.state === 'sent' &&
        !lastMessageReadByOtherSideAt &&
        formatChatTime(DateTime.fromMillis(message.message.time))}
      {message.state === 'received' &&
        formatChatTime(DateTime.fromMillis(message.message.time))}
    </Typography>
  )
}
