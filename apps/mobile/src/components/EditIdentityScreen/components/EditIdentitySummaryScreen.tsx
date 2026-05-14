import {useNavigationState} from '@react-navigation/native'
import {
  Button,
  ChevronLeft,
  InfoBox,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, Image as TamaguiImage, YStack} from 'tamagui'
import {type EditIdentityStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {
  editProfileIdentityImageUriAtom,
  editProfileIdentityNicknameAtom,
  saveEditProfileIdentityDraftActionAtom,
} from '../atoms/editIdentityAtoms'

type Props = EditIdentityStackScreenProps<'EditIdentitySummary'>

const PHOTO_SIZE = 252

function EditIdentitySummaryScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const previousRouteName = useNavigationState(
    (state) => state.routes[state.index - 1]?.name
  )
  const imageUri = useAtomValue(editProfileIdentityImageUriAtom)
  const nickname = useAtomValue(editProfileIdentityNicknameAtom)
  const saveDraft = useSetAtom(saveEditProfileIdentityDraftActionAtom)

  const closeFlow = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  const goBack = useCallback(() => {
    if (previousRouteName == null) {
      navigation.navigate('EditIdentityNickname')
      return
    }

    navigation.goBack()
  }, [navigation, previousRouteName])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editProfileScreen.identitySummary.title')}
          leftAction={{
            icon: ChevronLeft,
            onPress: goBack,
          }}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: closeFlow,
            },
          ]}
        />
      }
      footer={
        <YStack gap="$3">
          <InfoBox variant="default">
            {t('editProfileScreen.identitySummary.infoBox')}
          </InfoBox>
          <Button
            disabled={!imageUri || !nickname.trim()}
            onPress={() => {
              const wasSaved = saveDraft()

              if (wasSaved) {
                closeFlow()
              }
            }}
          >
            {t('editProfileScreen.identitySummary.saveButton')}
          </Button>
        </YStack>
      }
    >
      <YStack flex={1} alignItems="center" gap="$6" paddingTop="$4">
        <Typography variant="description" color="$foregroundSecondary">
          {t('editProfileScreen.identitySummary.description')}
        </Typography>
        {imageUri ? (
          <TamaguiImage
            borderRadius="$5"
            height={PHOTO_SIZE}
            width={PHOTO_SIZE}
            source={{uri: resolveLocalUri(imageUri)}}
          />
        ) : null}
        <Stack alignItems="center" alignSelf="stretch">
          <Typography variant="heading2" color="$foregroundPrimary">
            {nickname.trim()}
          </Typography>
        </Stack>
      </YStack>
    </Screen>
  )
}

export default EditIdentitySummaryScreen
