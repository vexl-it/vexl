import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {useAtomValue} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {type TradeChecklistStackParamsList} from '../../../../../../../navigationTypes'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import copySvg from '../../../../../../ChatDetailScreen/images/copySvg'
import Image from '../../../../../../Image'
import AnonymizationNotice from '../../../../AnonymizationNotice'
import {btcAddressAtom, btcNetworkAtom} from '../../../atoms'
import btcSvg from '../images/btcSvg'
import SectionTitle from './SectionTitle'

function BtcAddress(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const btcNetwork = useAtomValue(btcNetworkAtom)
  const btcAddress = useAtomValue(btcAddressAtom)

  if (btcNetwork === 'LIGHTING') return null

  return (
    <Stack>
      <SectionTitle
        text={t('tradeChecklist.btcAddress.btcAddress')}
        icon={btcSvg}
      />
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('BtcAddress')
        }}
      >
        <XStack ai="center" jc="space-between" p="$4" bc="$grey" br="$5">
          <Text
            fs={1}
            mr="$2"
            col={btcAddress ? '$white' : '$greyOnWhite'}
            fos={18}
            ff="$body500"
          >
            {btcAddress ?? t('tradeChecklist.network.pasteBtcAddress')}
          </Text>
          {btcAddress && (
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(btcAddress)
              }}
            >
              <Image
                height={24}
                width={24}
                source={copySvg}
                fill={getTokens().color.white.val}
              />
            </TouchableOpacity>
          )}
        </XStack>
      </TouchableOpacity>
      <AnonymizationNotice als="flex-start" mt="$2" />
    </Stack>
  )
}

export default BtcAddress
