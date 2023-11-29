import {Stack, Text, XStack} from 'tamagui'
import SectionTitle from './SectionTitle'
import btcSvg from '../images/btcSvg'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import AnonymizationNotice from '../../../../AnonymizationNotice'
import {TouchableOpacity} from 'react-native'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../../../navigationTypes'
import {useAtomValue} from 'jotai'
import {btcAddressAtom, btcNetworkAtom} from '../../../atoms'
import Image from '../../../../../../Image'
import copyPasteSvg from '../images/copyPasteSvg'
import Clipboard from '@react-native-clipboard/clipboard'

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
        <XStack
          ai={'center'}
          jc={'space-between'}
          p={'$4'}
          bc={'$grey'}
          br={'$5'}
        >
          <Text
            fs={1}
            mr={'$2'}
            col={btcAddress ? '$white' : '$greyOnWhite'}
            fos={18}
            ff={'$body500'}
          >
            {btcAddress ?? t('tradeChecklist.network.pasteBtcAddress')}
          </Text>
          {btcAddress && (
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(btcAddress)
              }}
            >
              <Image height={24} width={24} source={copyPasteSvg} />
            </TouchableOpacity>
          )}
        </XStack>
      </TouchableOpacity>
      <AnonymizationNotice als={'flex-start'} mt={'$2'} />
    </Stack>
  )
}

export default BtcAddress
