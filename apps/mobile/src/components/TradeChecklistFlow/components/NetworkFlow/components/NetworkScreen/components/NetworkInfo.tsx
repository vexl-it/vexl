import {InfoCircle, Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, XStack, useTheme} from 'tamagui'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {btcNetworkAtom} from '../../../atoms'

function NetworkInfo(): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const btcNetwork = useAtomValue(btcNetworkAtom)

  return (
    <XStack
      alignItems="flex-start"
      gap="$3"
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      p="$5"
    >
      <Stack pt="$0.5">
        <InfoCircle size={18} color={theme.foregroundSecondary.get()} />
      </Stack>
      <Typography variant="description" color="$foregroundSecondary" flex={1}>
        {btcNetwork === 'LIGHTING'
          ? t('tradeChecklist.network.youWillGenerateQrCode')
          : t('tradeChecklist.network.itsOkIfYouDontHaveBtcAddressNow')}
      </Typography>
    </XStack>
  )
}

export default NetworkInfo
