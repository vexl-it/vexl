import {JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {useAtom, useSetAtom, type PrimitiveAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useCallback} from 'react'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import {REACT_NATIVE_CALENDARS_DATE_FORMAT} from '../../../Calendar'
import DropdownSelectButton from '../../../DropdownSelectButton'
import SvgImage from '../../../Image'
import termsIconSvg from '../../../InsideRouter/components/SettingsScreen/images/termsIconSvg'
import Switch from '../../../Switch'
import clockSvg from '../../../images/clockSvg'
import OfferExpirationModal from './components/OfferExpirationModal'

interface Props {
  expirationDateAtom: PrimitiveAtom<JSDateString | undefined>
  offerExpirationModalVisibleAtom: PrimitiveAtom<boolean>
}

function Expiration({
  expirationDateAtom,
  offerExpirationModalVisibleAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const [expirationDate, setExpirationDate] = useAtom(expirationDateAtom)
  const setOfferExpirationModalVisible = useSetAtom(
    offerExpirationModalVisibleAtom
  )

  const toggleExpirationDate = useCallback(() => {
    if (expirationDate) setExpirationDate(undefined)
    else
      setExpirationDate(
        JSDateString.parse(
          DateTime.now().toFormat(REACT_NATIVE_CALENDARS_DATE_FORMAT)
        )
      )
  }, [expirationDate, setExpirationDate])

  return (
    <YStack mb="$4">
      <XStack ai="center" jc="space-between" py="$4">
        <XStack f={1} ai="center" mr="$1">
          <Stack mr="$2">
            <SvgImage
              stroke={
                expirationDate
                  ? getTokens().color.white.val
                  : getTokens().color.greyOnWhite.val
              }
              source={clockSvg}
            />
          </Stack>
          <Stack fs={1}>
            <Text
              numberOfLines={2}
              ff="$body700"
              col={expirationDate ? '$white' : '$greyOnWhite'}
              fos={24}
            >
              {t('offerForm.expiration.expiration')}
            </Text>
          </Stack>
        </XStack>
        <Switch value={!!expirationDate} onValueChange={toggleExpirationDate} />
      </XStack>
      <Text
        ff="$body500"
        fos={16}
        col={expirationDate ? '$white' : '$greyOnWhite'}
        mb="$4"
      >
        {t('offerForm.expiration.setExpirationDateForYourOffer')}
      </Text>
      {!!expirationDate && (
        <DropdownSelectButton
          onClearPress={() => {
            setExpirationDate(undefined)
          }}
          onPress={() => {
            setOfferExpirationModalVisible(true)
          }}
        >
          <XStack ai="center" gap="$2">
            <SvgImage
              source={termsIconSvg}
              stroke={getTokens().color.main.val}
            />
            <Text
              fos={18}
              ff="$body500"
              col={expirationDate ? '$main' : '$greyOnBlack'}
            >
              {expirationDate
                ? DateTime.fromISO(expirationDate).toLocaleString(
                    DateTime.DATE_FULL,
                    {locale}
                  )
                : t('offerForm.expiration.expirationDate')}
            </Text>
          </XStack>
        </DropdownSelectButton>
      )}
      <OfferExpirationModal
        expirationDateAtom={expirationDateAtom}
        offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
      />
    </YStack>
  )
}

export default Expiration
