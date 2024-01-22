import {useAtom, useAtomValue} from 'jotai'
import SvgQRCode from 'react-native-qrcode-svg'
import {Stack, Text, YStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {encodedUserDetailsUriAtom, qrCodeDialogVisibleAtom} from '../atoms'
import SettingsScreenDialog from './SettingsScreenDialog'

function QrCode(): JSX.Element {
  const {t} = useTranslation()
  const [qrCodeDialogVisible, setQrCodeDialogVisible] = useAtom(
    qrCodeDialogVisibleAtom
  )
  const encodedUserDetailsUri = useAtomValue(encodedUserDetailsUriAtom)

  return (
    <SettingsScreenDialog
      onClose={() => {
        setQrCodeDialogVisible(false)
      }}
      secondaryButton={{
        text: t('common.gotIt'),
      }}
      visible={qrCodeDialogVisible}
    >
      <YStack ai="center" space="$4">
        <Stack height={350} ai="center" jc="center">
          <SvgQRCode
            size={300}
            value={encodedUserDetailsUri}
            logo={require('../images/app_logo.png')}
          />
        </Stack>
        <Text col="$black" fos={28} ff="$heading">
          {t('qrCode.joinVexl')}
        </Text>
      </YStack>
    </SettingsScreenDialog>
  )
}

export default QrCode
