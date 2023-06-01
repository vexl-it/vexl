import WhiteContainer from '../../../WhiteContainer'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {fromImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {Stack, Text, useMedia} from 'tamagui'
import SelectProfilePicture from '../../../SelectProfilePicture'
import {useAtomValue} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {changeProfilePictureMolecule} from '../../../ChangeProfilePictureScope'

type Props = LoginStackScreenProps<'Photo'>

function PhotoScreen({
  navigation,
  route: {
    params: {userName},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const media = useMedia()
  const {selectedImageUriAtom} = useMolecule(changeProfilePictureMolecule)
  const selectedImageUri = useAtomValue(selectedImageUriAtom)

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
