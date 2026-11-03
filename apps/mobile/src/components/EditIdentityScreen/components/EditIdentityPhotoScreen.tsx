import {
  Button,
  Image,
  NavigationBar,
  PhotoPickerPlaceholder,
  Screen,
  Stack,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type EditIdentityStackScreenProps} from '../../../navigationTypes'
import {selectImageActionAtom} from '../../../state/selectImageActionAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {editProfileIdentityImageUriAtom} from '../atoms/editIdentityAtoms'
import {IDENTITY_PHOTO_SIZE} from '../identityPhotoSize'

type Props = EditIdentityStackScreenProps<'EditIdentityPhoto'>

function EditIdentityPhotoScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const imageUri = useAtomValue(editProfileIdentityImageUriAtom)
  const selectImage = useSetAtom(selectImageActionAtom)

  const closeFlow = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editProfileScreen.identityPhoto.title')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: closeFlow,
            },
          ]}
        />
      }
      footer={
        <Button
          onPress={() => {
            navigation.navigate('EditIdentityNickname')
          }}
        >
          {t('editProfileScreen.identityPhoto.nextButton')}
        </Button>
      }
    >
      <Stack flex={1} gap="$7" paddingTop="$4">
        <Typography variant="description" color="$foregroundSecondary">
          {t('editProfileScreen.identityPhoto.description')}
        </Typography>
        <YStack flex={1} alignItems="center" gap="$8" paddingTop="$6">
          {imageUri ? (
            <>
              <Image
                borderRadius="$5"
                height={IDENTITY_PHOTO_SIZE}
                width={IDENTITY_PHOTO_SIZE}
                source={{uri: resolveLocalUri(imageUri)}}
              />
              <Button
                variant="secondary"
                size="small"
                onPress={() => {
                  selectImage(editProfileIdentityImageUriAtom)
                }}
              >
                {t('editProfileScreen.identityPhoto.changePhotoButton')}
              </Button>
            </>
          ) : (
            <PhotoPickerPlaceholder
              size={IDENTITY_PHOTO_SIZE}
              onPress={() => {
                selectImage(editProfileIdentityImageUriAtom)
              }}
            />
          )}
        </YStack>
      </Stack>
    </Screen>
  )
}

export default EditIdentityPhotoScreen
