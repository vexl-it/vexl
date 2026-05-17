import Clipboard from '@react-native-clipboard/clipboard'
import {FlagReport, Stack, Typography, useTheme, XStack} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {atom, useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {contactSupportActionAtom} from '../utils/contactSupportActionAtom'
import {
  translationAtom,
  useTranslation,
} from '../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from './GlobalDialog'
import {toastNotificationAtom} from './ToastNotification/atom'

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
  const theme = useTheme()

  const supportEmail = t('settings.items.supportEmail')
  const contactSupport = useSetAtom(contactSupportActionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Stack gap="$2" jc="flex-end">
      <Typography
        color="$foregroundPrimary"
        my="$4"
        variant="graphPrice"
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {title ?? t('reportIssue.somethingWentWrong')}
      </Typography>
      <Typography variant="paragraph" color="$foregroundSecondary">
        {subtitle ?? t('reportIssue.feelFreeToGetInTouch')}
      </Typography>
      <XStack ai="center" gap="$3" mt="$6" onPress={contactSupport}>
        <Stack ai="center" jc="center" bc="$backgroundSecondary" p="$3" br="$5">
          <FlagReport color={theme.foregroundSecondary.get()} size={24} />
        </Stack>
        <TouchableOpacity
          onPress={() => {
            Clipboard.setString(supportEmail)
            setToastNotification(t('common.copied'))
          }}
        >
          <Typography variant="paragraph" color="$foregroundPrimary">
            {supportEmail}
          </Typography>
        </TouchableOpacity>
      </XStack>
    </Stack>
  )
}

export default ReportIssue
