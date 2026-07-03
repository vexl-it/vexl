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
import {Effect, Either} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {createNoteActionAtom} from '../../state/notes/atoms/createNoteActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {showErrorAlert} from '../ErrorAlert'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {toastNotificationAtom} from '../ToastNotification/atom'

type Props = RootStackScreenProps<'CreateNote'>

type ExpiresValue = '7' | '3' | '1'

const EXPIRES_VALUES: readonly ExpiresValue[] = ['7', '3', '1']

export default function CreateNoteScreen(_props: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
  const goBack = useSafeGoBack()

  const createNote = useSetAtom(createNoteActionAtom)
  const setLoading = useSetAtom(loadingOverlayDisplayedAtom)
  const setToast = useSetAtom(toastNotificationAtom)

  const [text, setText] = useState('')
  const [expiresValue, setExpiresValue] = useState<ExpiresValue>('7')
  const [allowRepost, setAllowRepost] = useState(false)

  const trimmedText = text.trim()
  const canPost = trimmedText.length > 0

  const iconSize = getTokens().size.$6.val

  const handlePost = useCallback(() => {
    if (!canPost) return

    setLoading(true)
    void Effect.runPromise(
      createNote({
        text: trimmedText,
        allowRepost,
        expiresAfterDays: Number(expiresValue),
      }).pipe(Effect.either)
    ).then((result) => {
      setLoading(false)
      if (Either.isRight(result)) {
        setToast({
          title: t('notes.create.postedToastTitle'),
          description: t('notes.create.postedToastDescription'),
        })
        goBack()
      } else {
        showErrorAlert({
          title: t('common.somethingWentWrong'),
          error: result.left,
        })
      }
    })
  }, [
    allowRepost,
    canPost,
    createNote,
    expiresValue,
    goBack,
    setLoading,
    setToast,
    t,
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
          <XStack alignItems="center" gap="$2">
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
          <XStack alignItems="center" gap="$2">
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
