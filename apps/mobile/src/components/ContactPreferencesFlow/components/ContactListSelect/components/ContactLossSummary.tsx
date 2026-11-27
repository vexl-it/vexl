import {ReachLabel, Typography, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Pressable} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import {globalDialogAtom} from '../../../../GlobalDialog'
import {contactSelectMolecule} from '../atom'

export default function ContactLossSummary(): React.JSX.Element | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {contactLossTotalAtom} = useMolecule(contactSelectMolecule)
  const loss = useAtomValue(contactLossTotalAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  if (loss === 0) return null
  const values = {count: loss, localizedString: formatInteger(loss, locale)}
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Effect.runFork(
          showDialog({
            children: (
              <YStack gap="$2">
                <Typography color="$foregroundPrimary" variant="heading3">
                  {t('contactPreferences.contactReach.lossSheet.total', values)}
                </Typography>
                <Typography color="$foregroundSecondary" variant="description">
                  {t('contactPreferences.contactReach.lossSheet.lead', values)}
                </Typography>
              </YStack>
            ),
            positiveButtonText: t('common.close'),
          })
        )
      }}
    >
      <XStack jc="center">
        <ReachLabel
          size="medium"
          tone="loss"
          label={t('contactPreferences.contactReach.submitLoss', values)}
        />
      </XStack>
    </Pressable>
  )
}
