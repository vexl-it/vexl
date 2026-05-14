import {TextField, Typography, YStack} from '@vexl-next/ui'
import {type SetStateAction, type WritableAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'

type StringAtom = WritableAtom<string, [SetStateAction<string>], void>

function DeleteAccountConfirmationDialogContent({
  confirmationAtom,
}: {
  readonly confirmationAtom: StringAtom
}): React.JSX.Element {
  const {t} = useTranslation()
  const confirmationText = t(
    'account.deleteAccountConfirmation.confirmationText'
  )

  return (
    <YStack gap="$3">
      <Typography color="$foregroundSecondary" variant="paragraphSmall">
        {t('account.deleteAccountConfirmation.description')}
      </Typography>
      <Typography color="$foregroundSecondary" variant="paragraphSmall">
        {t('account.deleteAccountConfirmation.prompt')}{' '}
        <Typography color="$redForeground" variant="paragraphSmall">
          {confirmationText}
        </Typography>
      </Typography>
      <YStack paddingTop="$1">
        <TextField
          autoFocus
          backgroundColor="$backgroundPrimary"
          borderColor="$accentYellowPrimary"
          valueAtom={confirmationAtom}
          placeholder={confirmationText}
        />
      </YStack>
    </YStack>
  )
}

export default DeleteAccountConfirmationDialogContent
