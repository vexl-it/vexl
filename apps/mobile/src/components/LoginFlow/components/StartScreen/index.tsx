import {useSetAtom} from 'jotai'
import React, {useEffect, useState} from 'react'
import {Image, TouchableOpacity} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import bigNameSvg from '../../../../images/bigNameSvg'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import clearMmkvStorageAndEmptyAtoms from '../../../../utils/clearMmkvStorageAndEmptyAtoms'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {showTosSummaryForAlreadyLoggedInUserAtom} from '../../../../utils/preferences'
import SVGImage from '../../../Image'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import Switch from '../../../Switch'
import WhiteContainer from '../../../WhiteContainer'
import notepadSvg from './images/notepadSvg'

type Props = LoginStackScreenProps<'Start'>

function StartScreen({navigation}: Props): React.ReactElement {
  const [touAgree, setTOUAgree] = useState(false)
  const setShowTosSummaryForAlreadyLoggedInUser = useSetAtom(
    showTosSummaryForAlreadyLoggedInUserAtom
  )

  const {t} = useTranslation()

  useEffect(() => {
    setShowTosSummaryForAlreadyLoggedInUser(false)
  }, [setShowTosSummaryForAlreadyLoggedInUser])

  return (
    <Stack testID="@startScreen" f={1} bg="$darkColorText">
      <HeaderProxy showBackButton={true} progressNumber={undefined} />
      <WhiteContainer>
        <Stack f={1} ai="center">
          <Stack f={1}>
            <Image
              style={{flex: 1}}
              resizeMode="contain"
              source={require('../../../../images/logo.png')}
            />
          </Stack>
          <Stack mb="$5">
            <SVGImage width={211} height={66} source={bigNameSvg} />
          </Stack>
          <Text fos={18} ff="$body500" col="$greyOnBlack">
            {t('loginFlow.start.subtitle')}
          </Text>
        </Stack>
      </WhiteContainer>
      <XStack ai="center" py="$4" px="$5" br="$5" my="$3" bc="$backgroundBlack">
        <XStack ai="center" gap="$2">
          <SVGImage source={notepadSvg} />
          <XStack f={1} ai="center" jc="space-between">
            <XStack fs={1} ai="center" fw="wrap">
              <Text fos={18} ff="$body500" col="$greyOnBlack">
                {t('loginFlow.start.touLabel')}{' '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('TermsAndConditions')
                }}
              >
                <Text fontSize={18} ff="$body600" col="$white">
                  {t('loginFlow.start.termsOfUse')}
                </Text>
              </TouchableOpacity>
            </XStack>
            <Switch
              testID="@startScreen/TOUSwitch"
              value={touAgree}
              onValueChange={setTOUAgree}
            />
          </XStack>
        </XStack>
      </XStack>
      <NextButtonProxy
        disabled={!touAgree}
        onPress={() => {
          // Lets make sure the device is fresh and clean before proceeding with login
          clearMmkvStorageAndEmptyAtoms()
          navigation.navigate('PhoneNumber')
        }}
        text={t('common.continue')}
      />
    </Stack>
  )
}

export default StartScreen
