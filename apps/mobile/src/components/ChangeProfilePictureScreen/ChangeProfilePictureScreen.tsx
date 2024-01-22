import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack, XStack, getTokens} from 'tamagui'
import {selectImageActionAtom} from '../../state/selectImageActionAtom'
import {realUserImageAtom} from '../../state/session'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import IconButton from '../IconButton'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import SelectProfilePicture from '../SelectProfilePicture'
import closeSvg from '../images/closeSvg'

const selectedImageUriAtom = atom<UriString | undefined>(undefined)

function ChangeProfilePictureScreen(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const safeGoBack = useSafeGoBack()

  const realUserImage = useAtomValue(realUserImageAtom)
  const [selectedImageUri, setSelectedImageUri] = useAtom(selectedImageUriAtom)
  const setRealUserImage = useSetAtom(realUserImageAtom)
  const selectImage = useSetAtom(selectImageActionAtom)

  const setRealUserImageAtom = useSetAtom(realUserImageAtom)

  useEffect(() => {
    setSelectedImageUri(realUserImage?.imageUri)
  }, [realUserImage?.imageUri, setSelectedImageUri])

  return (
    <Screen customHorizontalPadding={tokens.space[2].val}>
      <ScreenTitle text={t('changeProfilePicture.changeProfilePicture')}>
        <IconButton icon={closeSvg} onPress={safeGoBack} />
      </ScreenTitle>
      <Stack f={1} ai="center" jc="center">
        <SelectProfilePicture selectedImageUriAtom={selectedImageUriAtom} />
      </Stack>
      {selectedImageUri ? (
        <XStack space="$2">
          <Button
            fullSize
            onPress={() => {
              setRealUserImage(undefined)
              safeGoBack()
            }}
            variant="primary"
            text={t('changeProfilePicture.clearPhoto')}
          />
          <Button
            fullSize
            onPress={() => {
              if (selectedImageUri) {
                setRealUserImageAtom({
                  type: 'imageUri',
                  imageUri: selectedImageUri,
                })
                safeGoBack()
              }
            }}
            variant="secondary"
            text={t('common.confirm')}
          />
        </XStack>
      ) : (
        <Stack space="$2">
          <Button
            fullWidth
            onPress={() => {
              selectImage(selectedImageUriAtom)
            }}
            variant="secondary"
            text={t('changeProfilePicture.uploadNewPhoto')}
          />
          <Button
            fullWidth
            onPress={() => {
              setRealUserImage(undefined)
              safeGoBack()
            }}
            variant="primary"
            text={t('changeProfilePicture.clearPhoto')}
          />
        </Stack>
      )}
    </Screen>
  )
}

export default ChangeProfilePictureScreen
