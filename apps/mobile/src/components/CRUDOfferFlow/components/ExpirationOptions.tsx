import {useNavigation} from '@react-navigation/native'
import {
  Calendar,
  RowButton,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {formatDate} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {parseOfferExpirationDate} from '../../../utils/offerAmountDetails'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import MoreOptions from './MoreOptions'

function ExpirationOptions(): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const navigation = useNavigation()
  const {expirationDateAtom} = useMolecule(offerFormMolecule)
  const expirationDate = useAtomValue(expirationDateAtom)
  const setExpirationDate = useSetAtom(expirationDateAtom)

  const handleExpirationPress = useCallback(() => {
    navigation.navigate('OfferExpirationDate')
  }, [navigation])

  const clearExpiration = useCallback(() => {
    setExpirationDate(undefined)
  }, [setExpirationDate])

  return (
    <MoreOptions changedOptionsCount={expirationDate ? 1 : 0}>
      <YStack gap="$3">
        <Typography variant="paragraphDemibold" color="$foregroundPrimary">
          {t('offerForm.expiration.expirationDate')}
        </Typography>
        <RowButton
          label={
            expirationDate
              ? formatDate(parseOfferExpirationDate(expirationDate), locale, {
                  dateStyle: 'full',
                })
              : t('offerForm.expiration.selectDate')
          }
          icon={Calendar}
          onPress={handleExpirationPress}
          trailingAction={
            expirationDate
              ? {
                  icon: XmarkCancelClose,
                  accessibilityLabel: t('common.delete'),
                  onPress: clearExpiration,
                }
              : undefined
          }
        />
      </YStack>
    </MoreOptions>
  )
}

export default ExpirationOptions
