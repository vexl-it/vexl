import {getTokens, Text, YStack} from 'tamagui'
import Button from '../../../../Button'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNavigation} from '@react-navigation/native'
import Image from '../../../../Image'
import emptyMarketplaceAnonymousAvatarSvg from '../images/emptyMarketplaceAnonymousAvatarSvg'
import {useAtomValue} from 'jotai'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {ActivityIndicator} from 'react-native'

function EmptyListPlaceholder(): JSX.Element {
  const tokens = getTokens()
  const navigation = useNavigation()
  const {t} = useTranslation()
  const reachNumber = useAtomValue(reachNumberAtom)

  return (
    <YStack f={1} ai={'center'} jc={'center'} py="$4" space="$4">
      <Image source={emptyMarketplaceAnonymousAvatarSvg} />
      <ActivityIndicator color={tokens.color.main.val} />
      <YStack>
        <Text
          textAlign={'center'}
          col={'$greyOnWhite'}
          fos={20}
          ff={'$body600'}
        >
          {t('offer.listEmpty')}
        </Text>
        <Text
          textAlign={'center'}
          col={'$greyOnWhite'}
          fos={12}
          ff={'$body400'}
        >
          {t('offer.createOfferAndReachVexlers', {reachNumber})}
        </Text>
      </YStack>
      <Button
        text={t('offer.emptyAction')}
        variant={'primary'}
        size={'small'}
        onPress={() => {
          navigation.navigate('CreateOffer')
        }}
      ></Button>
    </YStack>
  )
}

export default EmptyListPlaceholder
