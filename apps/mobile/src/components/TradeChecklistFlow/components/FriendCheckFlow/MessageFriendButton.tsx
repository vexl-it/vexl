import {
  Button,
  Dialog,
  DialogTitle,
  IconButton,
  Share as ShareIcon,
  TextArea,
  Typography,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {Share} from 'react-native'
import {
  friendCheckMessage,
  type FriendCheckSubject,
} from '../../../../state/tradeChecklist/utils/friendCheck'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

const ICON_SIZE = 20
const MESSAGE_MIN_HEIGHT = 140

export default function MessageFriendButton({
  friendName,
  subject,
}: {
  readonly friendName: string
  readonly subject: FriendCheckSubject
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const canSend = message.trim().length > 0
  const title = t('tradeChecklist.friendCheck.messageDialog.title', {
    name: friendName,
  })

  const close = (): void => {
    setVisible(false)
  }

  return (
    <>
      <IconButton
        aria-label={t('tradeChecklist.friendCheck.messageFriend', {
          name: friendName,
        })}
        backgroundColor="$accentYellowSecondary"
        onPress={() => {
          setMessage(friendCheckMessage({t, friend: friendName, subject}))
          setVisible(true)
        }}
      >
        <ShareIcon
          color={theme.accentHighlightSecondary.get()}
          size={ICON_SIZE}
        />
      </IconButton>
      <Dialog
        visible={visible}
        onClose={close}
        footer={
          <>
            <Button flex={1} variant="secondary" onPress={close}>
              {t('common.close')}
            </Button>
            <Button
              flex={1}
              disabled={!canSend}
              onPress={() => {
                void Share.share({message})
              }}
            >
              {t('tradeChecklist.friendCheck.messageDialog.send')}
            </Button>
          </>
        }
      >
        <DialogTitle>{title}</DialogTitle>
        <YStack gap="$2">
          <TextArea
            aria-label={title}
            minHeight={MESSAGE_MIN_HEIGHT}
            backgroundColor="$backgroundTertiary"
            borderRadius="$5"
            borderWidth={0}
            padding="$4"
            color="$foregroundPrimary"
            fontFamily="$body"
            fontSize="$3"
            lineHeight={24}
            onChangeText={setMessage}
            value={message}
            verticalAlign="top"
          />
          <Typography variant="micro" color="$foregroundSecondary">
            {t('tradeChecklist.friendCheck.messageDialog.hint')}
          </Typography>
        </YStack>
      </Dialog>
    </>
  )
}
