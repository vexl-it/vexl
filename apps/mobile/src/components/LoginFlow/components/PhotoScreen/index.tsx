import WhiteContainer from '../../../WhiteContainer'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {
  fromImageUri,
  fromSvgString,
} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {Stack, Text, useMedia} from 'tamagui'
import SelectProfilePicture from '../../../SelectProfilePicture'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {changeProfilePictureMolecule} from '../../../ChangeProfilePictureScope'
import {getAvatarSvg} from '../../../AnonymousAvatar'
import randomNumber from '../../../../utils/randomNumber'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'

type Props = LoginStackScreenProps<'Photo'>

function PhotoScreen({
  navigation,
  route: {
    params: {userName},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const media = useMedia()
  const {selectedImageUriAtom, syncImageActionAtom} = useMolecule(
    changeProfilePictureMolecule
  )
  const selectedImageUri = useAtomValue(selectedImageUriAtom)
  const syncImageWithSessionUri = useSetAtom(syncImageActionAtom)

  useFocusEffect(
    useCallback(() => {
      syncImageWithSessionUri()
    }, [syncImageWithSessionUri])
  )

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
          <SelectProfilePicture />
        </Stack>
      </WhiteContainer>
      <NextButtonProxy
        disabled={false}
        onPress={() => {
          navigation.navigate('AnonymizationAnimation', {
            realUserData: UserNameAndAvatar.parse({
              userName,
              image:
                selectedImageUri._tag === 'Some'
                  ? fromImageUri(selectedImageUri.value)
                  : fromSvgString(getAvatarSvg(randomNumber(0, 3))),
            }),
          })
        }}
        text={t('common.continue')}
      />
    </>
  )
}

export default PhotoScreen
