import {useNavigation} from '@react-navigation/native'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
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
}): React.ReactElement {
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
          void Effect.runPromise(
            Effect.gen(function* (_) {
              const confirmed = yield* _(
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
                Effect.option
              )

              if (confirmed._tag === 'Some') {
                void Linking.openURL(t('btcPricePopup.url'))
              }
            })
          )
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
