import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../PageWithNavigationHeader'
import useSafeGoBack from '../../../../../utils/useSafeGoBack'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import TextInput from '../../../../Input'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import Content from '../../Content'
import {
  btcAddressAtom,
  displayParsingErrorAtom,
  saveBtcAddressActionAtom,
} from '../atoms'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useEffect} from 'react'
import Image from '../../../../Image'
import infoSvg from '../../../../images/infoSvg'

const btcAddressTempAtom = atom<string>('')

function BtcAddressScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const [displayParsingError, setDisplayParsingError] = useAtom(
    displayParsingErrorAtom
  )
  const btcAddress = useAtomValue(btcAddressAtom)
  const saveBtcAddress = useSetAtom(saveBtcAddressActionAtom)
  const [btcAddressTemp, setBtcAddressTemp] = useAtom(btcAddressTempAtom)

  useFocusEffect(
    useCallback(() => {
      setBtcAddressTemp(btcAddress ?? '')
    }, [btcAddress, setBtcAddressTemp])
  )

  useEffect(() => {
    setDisplayParsingError(false)
  }, [setDisplayParsingError])

  return (
    <>
      <HeaderProxy
        onClose={goBack}
        title={t('tradeChecklist.btcAddress.btcAddress')}
      />
      <Content scrollable>
        <Stack mt={'$6'}>
          <TextInput
            autoCapitalize={'none'}
            autoCorrect={false}
            style={{backgroundColor: getTokens().color.grey.val}}
            textAlign={'left'}
            value={btcAddressTemp}
            onChangeText={(text) => {
              if (displayParsingError) {
                setDisplayParsingError(false)
              }
              setBtcAddressTemp(text)
            }}
            selectionColor={getTokens().color.main.val}
            textColor={'$main'}
            placeholder={t('tradeChecklist.btcAddress.btcAddress')}
            showClearButton={!!btcAddressTemp}
            onClearPress={() => {
              setBtcAddressTemp('')
            }}
          />
          {displayParsingError && (
            <XStack ai={'center'} space={'$2'} mt={'$2'} ml={'$2'}>
              <Image source={infoSvg} fill={getTokens().color.red.val} />
              <Text col={'$red'} fos={14} ff={'$body500'}>
                {t('tradeChecklist.network.invalidBtcAddress')}
              </Text>
            </XStack>
          )}
        </Stack>
      </Content>
      <FooterButtonProxy
        onPress={() => {
          const success = saveBtcAddress(btcAddressTemp)
          if (success) goBack()
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default BtcAddressScreen
