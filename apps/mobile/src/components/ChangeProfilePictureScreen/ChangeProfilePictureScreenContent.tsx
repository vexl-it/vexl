import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {Stack, XStack} from 'tamagui'
import {useAtomValue, useSetAtom} from 'jotai'
import {userImageAtom} from '../../state/session'
import ScreenTitle from '../ScreenTitle'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import SelectProfilePicture from '../SelectProfilePicture'
import Button from '../Button'
import {useMolecule} from 'jotai-molecules'
import {changeProfilePictureMolecule} from '../ChangeProfilePictureScope'

function ChangeProfilePictureScreenContent(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const {didImageUriChangeAtom, selectedImageUriAtom, selectImageActionAtom} =
    useMolecule(changeProfilePictureMolecule)
  const selectedImageUri = useAtomValue(selectedImageUriAtom)
  const selectImage = useSetAtom(selectImageActionAtom)
  const didImageUriChange = useAtomValue(didImageUriChangeAtom)

  const setUserImageUriInState = useSetAtom(userImageAtom)

  return (
    <>
      <ScreenTitle text={t('changeProfilePicture.changeProfilePicture')}>
        <IconButton icon={closeSvg} onPress={safeGoBack} />
      </ScreenTitle>
      <Stack f={1} ai={'center'} jc={'center'}>
        <SelectProfilePicture />
      </Stack>
      {didImageUriChange ? (
        <XStack space={'$2'}>
          <Button
            fullSize
            onPress={safeGoBack}
            variant={'primary'}
            text={t('common.cancel')}
          />
          <Button
            fullSize
            onPress={() => {
              if (selectedImageUri._tag === 'Some') {
                setUserImageUriInState({
                  imageUri: selectedImageUri.value,
                  type: 'imageUri',
                })
                safeGoBack()
              }
            }}
            variant={'secondary'}
            text={t('common.confirm')}
          />
        </XStack>
      ) : (
        <Button
          fullWidth
          onPress={selectImage}
          variant={'secondary'}
          text={t('changeProfilePicture.uploadNewPhoto')}
        />
      )}
    </>
  )
}

export default ChangeProfilePictureScreenContent
