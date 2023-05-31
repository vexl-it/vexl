import WhiteContainer from '../../../WhiteContainer'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import {useCallback, useState} from 'react'
import {Alert, TouchableWithoutFeedback, View} from 'react-native'
import {
  getImageFromCameraAndTryToResolveThePermissionsAlongTheWay,
  getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay,
  type ImagePickerError,
} from './utils'
import {pipe} from 'fp-ts/function'
import SvgImage from '../../../Image'
import MiniCameraSvg from './images/miniCameraSvg'
import selectIconSvg from './images/selectIconSvg'
import {UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {fromImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import {type FileSystemError} from '../../../../utils/internalStorage'
import reportError from '../../../../utils/reportError'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {Image, Stack, Text, useMedia} from 'tamagui'

type Props = LoginStackScreenProps<'Photo'>

function PhotoScreen({
  navigation,
  route: {
    params: {userName},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const media = useMedia()
  const [selectedImageUri, setSelectedImageUri] = useState<O.Option<UriString>>(
    O.none
  )
  const reportAndTranslateErrors = useCallback(
    (error: FileSystemError | ImagePickerError): string => {
      if (error._tag === 'imagePickerError') {
        switch (error.reason) {
          case 'PermissionsNotGranted':
            return t('loginFlow.photo.permissionsNotGranted')
          case 'NothingSelected':
            return t('loginFlow.photo.nothingSelected')
        }
      }
      reportError('error', 'Unexpected error while picking image', error)
      return t('common.unknownError') // how is it that linter needs this line
    },
    [t]
  )

  const selectImage = useCallback(() => {
    Alert.alert(t('loginFlow.photo.selectSource'), undefined, [
      {
        text: t('loginFlow.photo.gallery'),
        onPress: () => {
          void pipe(
            getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay(),
            TE.mapLeft(reportAndTranslateErrors),
            TE.match(Alert.alert, (r) => {
              setSelectedImageUri(O.some(r))
            })
          )()
        },
      },
      {
        text: t('loginFlow.photo.camera'),
        onPress: () => {
          void pipe(
            getImageFromCameraAndTryToResolveThePermissionsAlongTheWay(),
            TE.mapLeft(reportAndTranslateErrors),
            TE.match(Alert.alert, (r) => {
              setSelectedImageUri(O.some(r))
            })
          )()
        },
      },
      {
        text: t('common.cancel'),
      },
    ])
  }, [t, reportAndTranslateErrors])

  return (
    <>
      <HeaderProxy showBackButton progressNumber={1} />
      <WhiteContainer>
        <Stack maw="70%">
          <Text
            numberOfLines={media.sm ? 2 : undefined}
            adjustsFontSizeToFit={media.sm}
            ff="$heading"
            fos={24}
          >
            {t('loginFlow.photo.title', {name: userName})}
          </Text>
        </Stack>
        <Stack mt="$4">
          <AnonymizationCaption />
        </Stack>
        <Stack f={1} ai="center" jc="center">
          <TouchableWithoutFeedback onPress={selectImage}>
            {selectedImageUri._tag === 'Some' ? (
              <View>
                <Stack>
                  <Image
                    height={128}
                    width={128}
                    br="$10"
                    src={{uri: selectedImageUri.value}}
                  />
                  <Stack
                    pos="absolute"
                    t="$-4"
                    r="$-4"
                    width={32}
                    h={32}
                    zi="$1"
                  >
                    <SvgImage source={MiniCameraSvg} />
                  </Stack>
                </Stack>
              </View>
            ) : (
              <Stack w={128} h={128}>
                <SvgImage source={selectIconSvg} />
              </Stack>
            )}
          </TouchableWithoutFeedback>
        </Stack>
      </WhiteContainer>
      <NextButtonProxy
        disabled={selectedImageUri._tag === 'None'}
        onPress={() => {
          if (selectedImageUri._tag === 'Some')
            navigation.navigate('AnonymizationAnimation', {
              realUserData: UserNameAndAvatar.parse({
                userName,
                image: fromImageUri(selectedImageUri.value),
              }),
            })
        }}
        text={t('common.continue')}
      />
    </>
  )
}

export default PhotoScreen
