import {Stack, Text, YStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'

function NitroPhoneCooperation(): JSX.Element {
  const {t} = useTranslation()

  return (
    <YStack gap="$4" my="$4">
      <Stack ai="center" mb="$4">
        <Image source={require('../images/nitroKeyLogo.png')} />
      </Stack>
      <Text fontFamily="$heading" fontSize={28} color="$black">
        {t('phoneCooperation.readyToTakeControl')}
      </Text>
      <Text fos={18} col="$greyOnWhite">
        {t('phoneCooperation.useCode')}
        <Text fos={24} col="$main" ff="$body700">
          VEXL2025
        </Text>
        {t('phoneCooperation.forDiscount')}
      </Text>
    </YStack>
  )
}

export default NitroPhoneCooperation
