import {useFocusEffect} from '@react-navigation/native'
import {InputHint, TextField} from '@vexl-next/ui'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../utils/useSafeGoBack'
import {TradeChecklistItemPageLayout} from '../../TradeChecklistItemPageLayout'
import {
  btcAddressAtom,
  btcAddressInputAtom,
  btcAddressTempAtom,
  displayParsingErrorAtom,
  saveBtcAddressActionAtom,
} from '../atoms'

function BtcAddressScreen(): React.ReactElement {
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
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.btcAddress.btcAddress'),
      }}
      bottomButton={{
        disabled: false,
        onPress: () => {
          const success = saveBtcAddress(btcAddressTemp)
          if (success) goBack()
        },
        text: t('common.save'),
        variant: 'secondary',
      }}
    >
      <Stack mt="$6">
        <TextField
          valueAtom={btcAddressInputAtom}
          placeholder={t('tradeChecklist.btcAddress.btcAddress')}
          showClear
        />
        {!!displayParsingError && (
          <InputHint variant="error">
            {t('tradeChecklist.network.invalidBtcAddress')}
          </InputHint>
        )}
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default BtcAddressScreen
