import {type ChatMessageRequiringNewerVersion} from '@vexl-next/domain/dist/general/messaging'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {compare} from '@vexl-next/domain/dist/utility/SmeverString.brand'
import {version} from '../../../utils/environment'

export default function MessageIncompatibleItem({
  message,
}: {
  message: ChatMessageRequiringNewerVersion
}): JSX.Element | null {
  const {t} = useTranslation()

  // There is nothing we can do now. If we were unable to recover the message...
  if (compare(message.minimalRequiredVersion)('<=', version)) return null

  return (
    <Stack mx={'$4'} mt={'$1'} flex={1} alignItems={'flex-start'}>
      <Stack
        gap="$1"
        maxWidth={'80%'}
        br={'$6'}
        backgroundColor={'$grey'}
        p={'$3'}
      >
        <Text fontFamily={'$body500'} color="$white">
          {t('messages.incompatible.title')}
        </Text>
        <Text fos={12} fontFamily={'$body500'} color="$red">
          {t('messages.incompatible.text', {
            targetVersion: message.minimalRequiredVersion,
          })}
        </Text>
      </Stack>
    </Stack>
  )
}
