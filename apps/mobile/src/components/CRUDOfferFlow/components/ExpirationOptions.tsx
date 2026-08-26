import {useNavigation} from '@react-navigation/native'
import {IconButton, RowButton, Typography} from '@vexl-next/ui'
import {Calendar, XmarkCancelClose} from '@vexl-next/ui/src/icons'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, useTheme, YStack} from 'tamagui'
import {formatDate} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import MoreOptions from './MoreOptions'

function ExpirationOptions(): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const navigation = useNavigation()
  const theme = useTheme()
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
        <Stack>
          <RowButton
            label={
              expirationDate
                ? formatDate(new Date(expirationDate), locale, {
                    dateStyle: 'full',
                  })
                : t('offerForm.expiration.selectDate')
            }
            icon={Calendar}
            paddingRight={expirationDate ? '$11' : undefined}
            onPress={handleExpirationPress}
          />
          {expirationDate ? (
            <IconButton
              position="absolute"
              right="$3"
              top="$3"
              aria-label={t('common.delete')}
              onPress={clearExpiration}
            >
              <XmarkCancelClose
                color={theme.foregroundPrimary.get()}
                size={24}
              />
            </IconButton>
          ) : null}
        </Stack>
      </YStack>
    </MoreOptions>
  )
}

export default ExpirationOptions
