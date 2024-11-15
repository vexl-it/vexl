import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack, XStack, getTokens} from 'tamagui'
import {realUserImageAtom} from '../../state/session'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import SelectProfilePicture from '../SelectProfilePicture'

const selectedImageUriAtom = atom<UriString | undefined>(undefined)

function ChangeProfilePictureScreen(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const safeGoBack = useSafeGoBack()

  const realUserImage = useAtomValue(realUserImageAtom)
  const [selectedImageUri, setSelectedImageUri] = useAtom(selectedImageUriAtom)

  const setRealUserImageAtom = useSetAtom(realUserImageAtom)

  useEffect(() => {
    setSelectedImageUri(realUserImage?.imageUri)
  }, [realUserImage?.imageUri, setSelectedImageUri])

  return (
    <Screen customHorizontalPadding={tokens.space[2].val}>
      <ScreenTitle
        text={t('changeProfilePicture.changeProfilePicture')}
        withBackButton
      />
      <Stack f={1} ai="center" jc="center">
        <SelectProfilePicture selectedImageUriAtom={selectedImageUriAtom} />
      </Stack>
      <XStack gap="$2">
        <Button
          fullSize
          onPress={() => {
            setRealUserImageAtom(
              selectedImageUri
                ? {
                    type: 'imageUri',
                    imageUri: selectedImageUri,
                  }
                : undefined
            )
            safeGoBack()
          }}
          variant="secondary"
          text={t('common.save')}
        />
      </XStack>
    </Screen>
  )
}

export default ChangeProfilePictureScreen
