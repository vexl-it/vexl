import Clipboard from '@react-native-clipboard/clipboard'
import {Effect} from 'effect/index'
import {atom, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import Image from '../../../../Image'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {type ToastNotificationState} from '../../../../ToastNotification/domain'
import checkIconSvg from '../../../../images/checkIconSvg'
import {contactSupportActionAtom} from '../atoms'
import emailIconSvg from '../images/emailIconSvg'

// atom needs to be defined here to avoid circular dependencies with MainSectionComponent: ReportIssue used in askAreYouSureActionAtom
export const reportIssueDialogAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return set(askAreYouSureActionAtom, {
    variant: 'info',
    steps: [
      {
        type: 'StepWithChildren',
        MainSectionComponent: ReportIssue,
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
})

function ReportIssue(): JSX.Element {
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
        {t('reportIssue.somethingWentWrong')}
      </Text>
      <Text fos={18} ff="$body500" col="$greyOnWhite">
        {t('reportIssue.feelFreeToGetInTouch')}
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
