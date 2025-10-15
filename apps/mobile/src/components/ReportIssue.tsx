import Clipboard from '@react-native-clipboard/clipboard'
import {Effect} from 'effect/index'
import {atom, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {contactSupportActionAtom} from '../utils/contactSupportActionAtom'
import {
  translationAtom,
  useTranslation,
} from '../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from './AreYouSureDialog'
import Image from './Image'
import checkIconSvg from './images/checkIconSvg'
import emailIconSvg from './images/emailIconSvg'
import {toastNotificationAtom} from './ToastNotification/atom'
import {type ToastNotificationState} from './ToastNotification/domain'

// atom needs to be defined here to avoid circular dependencies with MainSectionComponent: ReportIssue used in askAreYouSureActionAtom
export const reportIssueDialogAtom = atom(
  null,
  (get, set, {title, subtitle}: {title?: string; subtitle?: string} = {}) => {
    const {t} = get(translationAtom)

    return set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          type: 'StepWithChildren',
          MainSectionComponent: () => (
            <ReportIssue title={title} subtitle={subtitle} />
          ),
          positiveButtonText: t('reportIssue.openInEmail'),
          negativeButtonText: t('common.gotIt'),
        },
      ],
    }).pipe(
      Effect.tap(() => {
        set(contactSupportActionAtom)
      }),
      Effect.ignore
    )
  }
)

interface Props {
  title?: string
  subtitle?: string
}

function ReportIssue({title, subtitle}: Props): React.ReactElement {
  const {t} = useTranslation()
  const tokens = getTokens()

  const supportEmail = t('settings.items.supportEmail')
  const contactSupport = useSetAtom(contactSupportActionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  const toastContent: ToastNotificationState = useMemo(
    () => ({
      visible: true,
      text: t('common.copied'),
      icon: checkIconSvg,
    }),
    [t]
  )

  return (
    <Stack gap="$2" jc="flex-end">
      <Text
        col="$black"
        my="$4"
        ff="$heading"
        fos={28}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {title ?? t('reportIssue.somethingWentWrong')}
      </Text>
      <Text fos={18} ff="$body500" col="$greyOnWhite">
        {subtitle ?? t('reportIssue.feelFreeToGetInTouch')}
      </Text>
      <XStack ai="center" gap="$3" mt="$6" onPress={contactSupport}>
        <Stack ai="center" jc="center" bc="$greyAccent5" p="$3" br="$5">
          <Image stroke={tokens.color.greyOnWhite.val} source={emailIconSvg} />
        </Stack>
        <TouchableOpacity
          onPress={() => {
            Clipboard.setString(supportEmail)
            setToastNotification(toastContent)
          }}
        >
          <Text fos={18} ff="$body500" col="$black">
            {supportEmail}
          </Text>
        </TouchableOpacity>
      </XStack>
    </Stack>
  )
}

export default ReportIssue
