import {RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  fromImageUri,
  fromSvgString,
} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {atom, useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text, useMedia} from 'tamagui'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import randomNumber from '../../../../utils/randomNumber'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {getAvatarSvg} from '../../../AnonymousAvatar'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import SelectProfilePicture from '../../../SelectProfilePicture'
import WhiteContainer from '../../../WhiteContainer'

const selectedImageUriAtom = atom<UriString | undefined>(undefined)

type Props = LoginStackScreenProps<'Photo'>

function PhotoScreen({
  navigation,
  route: {
    params: {userName},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const media = useMedia()
  const selectedImageUri = useAtomValue(selectedImageUriAtom)

  return (
    <>
      <HeaderProxy showBackButton progressNumber={1} />
      <WhiteContainer>
        <Stack maw="70%">
          <Text
            col="$black"
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
          <SelectProfilePicture selectedImageUriAtom={selectedImageUriAtom} />
        </Stack>
      </WhiteContainer>
      <NextButtonProxy
        disabled={false}
        onPress={() => {
          navigation.navigate('AnonymizationAnimation', {
            realUserData: RealLifeInfo.parse({
              userName,
              image: selectedImageUri
                ? fromImageUri(selectedImageUri)
                : fromSvgString(
                    getAvatarSvg({avatarIndex: randomNumber(0, 3)})
                  ),
            }),
          })
        }}
        text={t('common.continue')}
      />
    </>
  )
}

export default PhotoScreen
