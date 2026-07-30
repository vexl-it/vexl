import {NOTE_TEXT_MAX_LENGTH} from '@vexl-next/domain/src/general/notes'
import {
  Button,
  LabeledTextArea,
  NavigationBar,
  RadioGroup,
  RefreshArrowsRectangle,
  RowCheckbox,
  RowRadiobutton,
  SandWatch,
  Screen,
  Typography,
  XStack,
  XmarkCancelClose,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {postNoteActionAtom} from '../../state/notes/atoms/postNoteActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import usePreventDiscardChangesWithConfirmation from '../../utils/usePreventDiscardChangesWithConfirmation'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {globalDialogAtom} from '../GlobalDialog'

type Props = RootStackScreenProps<'CreateNote'>

type ExpiresValue = '7' | '3' | '1'

const EXPIRES_VALUES: readonly ExpiresValue[] = ['7', '3', '1']

export default function CreateNoteScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
  const goBack = useSafeGoBack()
  const postNote = useSetAtom(postNoteActionAtom)
  const showDialog = useSetAtom(globalDialogAtom)

  const [text, setText] = useState('')
  const [expiresValue, setExpiresValue] = useState<ExpiresValue>('7')
  const [allowRepost, setAllowRepost] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  const trimmedText = text.trim()
  const canPost = trimmedText.length > 0 && !isPosting
  const hasChanges = text.length > 0 || expiresValue !== '7' || allowRepost

  const iconSize = getTokens().size.$7.val

  const confirmDiscardNote = useCallback(
    (): Promise<boolean> =>
      Effect.runPromise(
        showDialog({
          title: t('common.youSure'),
          subtitle: t('offerForm.discardNewOfferDescription'),
          positiveButtonText: t('common.discard'),
          positiveButtonVariant: 'destructive',
          negativeButtonText: t('common.goBack'),
        })
      ),
    [showDialog, t]
  )

  const {allowNextRemove} = usePreventDiscardChangesWithConfirmation({
    enabled: hasChanges,
    confirmLeave: confirmDiscardNote,
    fallbackLeave: goBack,
  })

  const handlePost = useCallback(() => {
    if (!canPost) return

    setIsPosting(true)
    void Effect.runPromise(
      postNote({
        text: trimmedText,
        allowRepost,
        expiresAfterDays: Number(expiresValue),
        navigation,
        allowNextRemove,
      })
    ).then((success) => {
      if (!success) setIsPosting(false)
    })
  }, [
    allowNextRemove,
    allowRepost,
    canPost,
    expiresValue,
    navigation,
    postNote,
    trimmedText,
  ])

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('notes.create.title')}
          rightActions={[{icon: XmarkCancelClose, onPress: goBack}]}
        />
      }
      footer={
        <Button variant="primary" disabled={!canPost} onPress={handlePost}>
          {t('notes.create.postNote')}
        </Button>
      }
    >
      <YStack gap="$6" paddingTop="$4">
        <LabeledTextArea
          label={t('notes.create.yourNote')}
          value={text}
          onChangeText={setText}
          placeholder={t('notes.create.placeholder')}
          maxLength={NOTE_TEXT_MAX_LENGTH}
        />

        <YStack gap="$3">
          <XStack alignItems="center" gap="$2" py="$3">
            <SandWatch color={theme.foregroundPrimary.get()} size={iconSize} />
            <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
              {t('notes.create.expires')}
            </Typography>
          </XStack>
          <RadioGroup
            allowedValues={EXPIRES_VALUES}
            value={expiresValue}
            onValueChange={setExpiresValue}
            gap="$3"
          >
            <RowRadiobutton
              value="7"
              label={t('notes.create.expiresIn7Days')}
            />
            <RowRadiobutton
              value="3"
              label={t('notes.create.expiresIn3Days')}
            />
            <RowRadiobutton value="1" label={t('notes.create.expiresIn1Day')} />
          </RadioGroup>
        </YStack>

        <YStack gap="$3">
          <XStack alignItems="center" gap="$2" py="$3">
            <RefreshArrowsRectangle
              color={theme.foregroundPrimary.get()}
              size={iconSize}
            />
            <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
              {t('notes.create.repost')}
            </Typography>
          </XStack>
          <RowCheckbox
            label={t('notes.create.allowRepost')}
            description={t('notes.create.allowRepostDescription')}
            checked={allowRepost}
            onCheckedChange={setAllowRepost}
          />
        </YStack>
      </YStack>
    </Screen>
  )
}
