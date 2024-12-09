import {useAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import chevronDownSvg from '../../../../../images/chevronDownSvg'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {marketplaceFiatOrSatsCurrencyAtom} from '../../../../../utils/preferences'
import Image from '../../../../Image'

function FiatSatsDropdown(): JSX.Element {
  const {t} = useTranslation()
  const [marketplaceFiatOrSatsCurrency, setMarketplaceFiatOrSatsCurrency] =
    useAtom(marketplaceFiatOrSatsCurrencyAtom)

  return (
    <XStack f={1} ai="center" space="$2">
      <Text ff="$body600" color="$greyOnBlack">
        {t('offer.priceIn')}
      </Text>
      <Stack f={1}>
        <TouchableOpacity
          onPress={() => {
            setMarketplaceFiatOrSatsCurrency(
              marketplaceFiatOrSatsCurrency === 'FIAT' ? 'SATS' : 'FIAT'
            )
          }}
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="$grey"
            borderRadius="$2"
            paddingHorizontal="$2"
            height={30}
          >
            <Text fontSize={14} fontFamily="$body600" color="$greyOnBlack">
              {t(`common.${marketplaceFiatOrSatsCurrency}`)}
            </Text>
            <Image
              source={chevronDownSvg}
              stroke={getTokens().color.greyOnBlack.val}
            />
          </XStack>
        </TouchableOpacity>
      </Stack>
    </XStack>
  )
}

export default FiatSatsDropdown
