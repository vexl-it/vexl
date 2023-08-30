import Screen from '../Screen'
import {useAtomValue, useSetAtom} from 'jotai'
import {userImageAtom} from '../../state/session'
import {getTokens, Stack, XStack} from 'tamagui'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'
import {useMolecule} from 'jotai-molecules'
import ScreenTitle from '../ScreenTitle'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import SelectProfilePicture from '../SelectProfilePicture'
import Button from '../Button'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {changeProfilePictureMolecule} from '../../state/changeProfilePictureMolecule'

function ChangeProfilePictureScreen(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const safeGoBack = useSafeGoBack()
  const {
    didImageUriChangeAtom,
    selectedImageUriAtom,
    selectImageActionAtom,
    syncImageActionAtom,
  } = useMolecule(changeProfilePictureMolecule)
  const syncImageWithSessionUri = useSetAtom(syncImageActionAtom)
  const selectedImageUri = useAtomValue(selectedImageUriAtom)
  const selectImage = useSetAtom(selectImageActionAtom)
  const didImageUriChange = useAtomValue(didImageUriChangeAtom)

  const setUserImageUriInState = useSetAtom(userImageAtom)

  useFocusEffect(
    useCallback(() => {
      syncImageWithSessionUri()
    }, [syncImageWithSessionUri])
  )

  return (
    <Screen customHorizontalPadding={tokens.space[2].val}>
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
    </Screen>
  )
}

export default ChangeProfilePictureScreen
