import {CopyField, Stack, Typography} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {atom, useSetAtom} from 'jotai'
import React from 'react'
import {contactSupportActionAtom} from '../utils/contactSupportActionAtom'
import {copyToClipboardWithToastActionAtom} from '../utils/copyToClipboardWithToastActionAtom'
import {
  translationAtom,
  useTranslation,
} from '../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from './GlobalDialog'

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

  const supportEmail = t('settings.items.supportEmail')
  const contactSupport = useSetAtom(contactSupportActionAtom)
  const copyToClipboard = useSetAtom(copyToClipboardWithToastActionAtom)

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
      <CopyField
        mt="$6"
        backgroundColor="$backgroundPrimary"
        value={supportEmail}
        copyAccessibilityLabel={t('common.copy')}
        onPress={contactSupport}
        onCopy={() => {
          copyToClipboard(supportEmail)
        }}
      />
    </Stack>
  )
}

export default ReportIssue
