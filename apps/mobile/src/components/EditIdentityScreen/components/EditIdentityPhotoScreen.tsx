import {
  Button,
  Camera,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import Svg, {Rect} from 'react-native-svg'
import {
  getTokens,
  Stack,
  Image as TamaguiImage,
  useTheme,
  YStack,
} from 'tamagui'
import {type EditIdentityStackScreenProps} from '../../../navigationTypes'
import {selectImageActionAtom} from '../../../state/selectImageActionAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {
  editProfileIdentityImageUriAtom,
  prepareEditProfileIdentityDraftActionAtom,
} from '../atoms/editIdentityAtoms'

type Props = EditIdentityStackScreenProps<'EditIdentityPhoto'>

const PHOTO_SIZE = 256
const DASHED_BORDER_WIDTH = 1
const DASHED_BORDER_INSET = DASHED_BORDER_WIDTH / 2
const DASHED_BORDER_RECT_SIZE = PHOTO_SIZE - DASHED_BORDER_WIDTH
const DASHED_BORDER_RADIUS = getTokens().radius[5].val

function EditIdentityPhotoScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const imageUri = useAtomValue(editProfileIdentityImageUriAtom)
  const selectImage = useSetAtom(selectImageActionAtom)
  const prepareDraft = useSetAtom(prepareEditProfileIdentityDraftActionAtom)

  useEffect(() => {
    prepareDraft()
  }, [prepareDraft])

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
          disabled={!imageUri}
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
              <TamaguiImage
                borderRadius="$5"
                height={PHOTO_SIZE}
                width={PHOTO_SIZE}
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
            <TouchableOpacity
              style={{
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
              onPress={() => {
                selectImage(editProfileIdentityImageUriAtom)
              }}
            >
              <Stack
                alignItems="center"
                justifyContent="center"
                borderRadius="$5"
                position="relative"
                width={PHOTO_SIZE}
                height={PHOTO_SIZE}
              >
                <Svg
                  pointerEvents="none"
                  style={StyleSheet.absoluteFill}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${PHOTO_SIZE} ${PHOTO_SIZE}`}
                >
                  <Rect
                    width={DASHED_BORDER_RECT_SIZE}
                    height={DASHED_BORDER_RECT_SIZE}
                    rx={DASHED_BORDER_RADIUS}
                    ry={DASHED_BORDER_RADIUS}
                    fill="none"
                    stroke={theme.foregroundTertiary.get()}
                    strokeWidth={DASHED_BORDER_WIDTH}
                    strokeDasharray="6 6"
                    transform={`translate(${DASHED_BORDER_INSET} ${DASHED_BORDER_INSET})`}
                  />
                </Svg>
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  width={88}
                  height={88}
                  borderRadius={44}
                  backgroundColor="$accentYellowPrimary"
                >
                  <Camera size={40} color={theme.black100.get()} />
                </Stack>
              </Stack>
            </TouchableOpacity>
          )}
        </YStack>
      </Stack>
    </Screen>
  )
}

export default EditIdentityPhotoScreen
