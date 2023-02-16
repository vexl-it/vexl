import {TitleText} from '../../../Text'
import WhiteContainer from '../../../WhiteContainer'
import styled from '@emotion/native'
import AnonymizationCaption from '../AnonymizationCaption'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type LoginStackParamsList} from '../../index'
import {useCallback, useState} from 'react'
import {Alert, View} from 'react-native'
import {getImageFromCamera, getImageFromGallery} from './utils'
import {pipe} from 'fp-ts/function'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import Image from '../../../Image'
import MiniCameraSvg from './images/miniCameraSvg'
import selectIconSvg from './images/selectIconSvg'
import {UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {fromImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import NextButtonPortal from '../NextButtonPortal'
import {useSetHeaderState} from '../../state/headerStateAtom'

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

type Props = NativeStackScreenProps<LoginStackParamsList, 'Photo'>

function PhotoScreen({
  navigation,
  route: {
    params: {userName},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  useSetHeaderState(
    () => ({
      showBackButton: true,
      progressNumber: 1,
    }),
    []
  )
  const [selectedImageUri, setSelectedImageUri] = useState<O.Option<UriString>>(
    O.none
  )

  const translateErrors = useCallback(
    (
      errorType: 'PermissionsNotGranted' | 'UnknownError' | 'NothingSelected'
    ): string => {
      switch (errorType) {
        case 'PermissionsNotGranted':
          return t('loginFlow.photo.permissionsNotGranted')
        case 'NothingSelected':
          return t('loginFlow.photo.nothingSelected')
        case 'UnknownError':
          return t('common.unknownError')
      }
    },
    [t]
  )

  const selectImage = useCallback(() => {
    Alert.alert(t('loginFlow.photo.selectSource'), undefined, [
      {
        text: t('loginFlow.photo.gallery'),
        onPress: () => {
          void getImageFromGallery().then((result) => {
            pipe(
              result,
              E.mapLeft(translateErrors),
              E.fold(Alert.alert, (r) => {
                setSelectedImageUri(O.some(r))
              })
            )
          })
        },
      },
      {
        text: t('loginFlow.photo.camera'),
        onPress: () => {
          void getImageFromCamera().then((result) => {
            pipe(
              result,
              E.mapLeft(translateErrors),
              E.fold(Alert.alert, (v) => {
                setSelectedImageUri(O.some(v))
              })
            )
          })
        },
      },
      {
        text: t('common.cancel'),
      },
    ])
  }, [t, setSelectedImageUri])

  return (
    <>
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
      <NextButtonPortal
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
