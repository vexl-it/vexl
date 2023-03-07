import {TitleText} from '../../../Text'
import WhiteContainer from '../../../WhiteContainer'
import styled from '@emotion/native'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import {useCallback, useState} from 'react'
import {Alert, View} from 'react-native'
import {
  getImageFromCameraAndTryToResolveThePermissionsAlongTheWay,
  getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay,
  type ImagePickerError,
} from './utils'
import {pipe} from 'fp-ts/function'
import Image from '../../../Image'
import MiniCameraSvg from './images/miniCameraSvg'
import selectIconSvg from './images/selectIconSvg'
import {UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {fromImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import {
  copyFileLocalDirectoryAndKeepName,
  type FileSystemError,
} from '../../../../utils/internalStorage'
import {PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import reportError from '../../../../utils/reportError'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'

const WhiteContainerStyled = styled(WhiteContainer)``
const AnonymizationCaptionStyled = styled(AnonymizationCaption)`
  margin-top: 16px;
`
const Title = styled(TitleText)``

const ImageAreaContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`
const ImagePressable = styled.TouchableWithoutFeedback``
const NotPickedImage = styled(Image)`
  width: 128px;
  height: 128px;
`
const PickedImageContainer = styled.View`
  position: relative;
`
const MiniCameraStyled = styled(Image)`
  position: absolute;
  top: -16px;
  right: -16px;
  width: 32px;
  height: 32px;
  z-index: 2;
`
const PickedImage = styled(Image)`
  width: 128px;
  height: 128px;
  border-radius: 30px;
`

type Props = LoginStackScreenProps<'Photo'>

function PhotoScreen({
  navigation,
  route: {
    params: {userName},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
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
            TE.chainW((imageUri) =>
              copyFileLocalDirectoryAndKeepName({
                sourceUri: imageUri,
                targetFolder: PathString.parse('/'),
              })
            ),
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
            TE.chainW((imageUri) =>
              copyFileLocalDirectoryAndKeepName({
                sourceUri: imageUri,
                targetFolder: PathString.parse('/'),
              })
            ),
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
      <WhiteContainerStyled>
        <Title>{t('loginFlow.photo.title', {name: userName})}</Title>
        <AnonymizationCaptionStyled />
        <ImageAreaContainer>
          <ImagePressable onPress={selectImage}>
            {selectedImageUri._tag === 'Some' ? (
              <View>
                <PickedImageContainer>
                  <PickedImage source={{uri: selectedImageUri.value}} />
                  <MiniCameraStyled source={MiniCameraSvg} />
                </PickedImageContainer>
              </View>
            ) : (
              <NotPickedImage source={selectIconSvg} />
            )}
          </ImagePressable>
        </ImageAreaContainer>
      </WhiteContainerStyled>
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
