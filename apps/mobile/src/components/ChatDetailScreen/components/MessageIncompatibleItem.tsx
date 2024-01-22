import {type ChatMessageRequiringNewerVersion} from '@vexl-next/domain/src/general/messaging'
import {compare} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {version} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import openUrl from '../../../utils/openUrl'
import Button from '../../Button'
import Image from '../../Image'
import warningSvg from '../images/warningSvg'

const DOWNLOAD_URL = 'https://vexl.it/download'

export default function MessageIncompatibleItem({
  message,
}: {
  message: ChatMessageRequiringNewerVersion
}): JSX.Element | null {
  const {t} = useTranslation()

  // There is nothing we can do now. If we were unable to recover the message...
  if (compare(message.minimalRequiredVersion)('<=', version)) return null

  return (
    <Stack mx="$4" mt="$1" flex={1} alignItems="flex-start">
      <Stack gap="$2" maxWidth="80%" br="$6" backgroundColor="$grey" p="$3">
        <XStack gap="$2">
          <Image
            stroke={getTokens().color.red.val}
            width={18}
            height={18}
            source={warningSvg}
          />
          <Text fontFamily="$body500" color="$white">
            {t('messages.incompatible.title')}
          </Text>
        </XStack>
        <Text fos={12} fontFamily="$body500" color="$red">
          {t('messages.incompatible.text', {
            targetVersion: message.minimalRequiredVersion,
          })}
        </Text>
        <Button
          size="small"
          variant="redDark"
          onPress={openUrl(DOWNLOAD_URL)}
          text={t('ForceUpdateScreen.action')}
        />
      </Stack>
    </Stack>
  )
}
