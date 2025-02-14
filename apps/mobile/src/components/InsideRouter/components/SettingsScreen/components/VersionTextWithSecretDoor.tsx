import {useNavigation} from '@react-navigation/native'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useSetAtom} from 'jotai'
import {Linking, type StyleProp, type ViewStyle} from 'react-native'
import {TouchableWithoutFeedback} from 'react-native-gesture-handler'
import {Text} from 'tamagui'
import {version, versionCode} from '../../../../../utils/environment'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import SecretDoor from '../../../../SecretDoor'

function VersionTextWithSecretDoor({
  style,
}: {
  style?: StyleProp<ViewStyle>
}): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const askAreYouSureAction = useSetAtom(askAreYouSureActionAtom)

  return (
    <SecretDoor
      onSecretDoorOpen={() => {
        navigation.navigate('DebugScreen')
      }}
    >
      <Text ta="center" fos={14} col="$greyOnBlack">
        {t('settings.version', {version: `${version} (${versionCode})`})}
      </Text>
      <TouchableWithoutFeedback
        onPress={() => {
          void pipe(
            askAreYouSureAction({
              variant: 'info',
              steps: [
                {
                  type: 'StepWithText',
                  title: t('btcPricePopup.titleRate'),
                  description: t('btcPricePopup.description'),
                  positiveButtonText: t('common.learnMore'),
                  negativeButtonText: t('common.close'),
                },
              ],
            }),
            effectToTaskEither,
            TE.match(
              () => {},
              () => {
                void Linking.openURL(t('btcPricePopup.url'))
              }
            )
          )()
        }}
      >
        <Text ta="center" fos={12} col="$greyAccent2">
          {t('settings.btcPriceSourceCreditYadio')}
        </Text>
      </TouchableWithoutFeedback>
    </SecretDoor>
  )
}

export default VersionTextWithSecretDoor
