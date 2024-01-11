import {Stack, Text, XStack} from 'tamagui'
import TextInput from '../Input'
import Checkbox from '../Checkbox'
import {type PrimitiveAtom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {type ReactNode, useEffect} from 'react'
import SelectProfilePicture from '../SelectProfilePicture'
import {realUserImageAtom, realUserNameAtom} from '../../state/session'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {useTranslation} from '../../utils/localization/I18nProvider'

interface ContentProps {
  children: ReactNode
  title: string
  subtitle: string
  checkboxValueAtom: PrimitiveAtom<boolean>
}

function Content({
  checkboxValueAtom,
  children,
  title,
  subtitle,
}: ContentProps): JSX.Element {
  const [checkboxValue, setCheckboxValue] = useAtom(checkboxValueAtom)

  return (
    <Stack space={'$4'}>
      <Text fontFamily={'$heading'} fontSize={32} color={'$black'}>
        {title}
      </Text>
      <Text fontSize={18} color={'$greyOnWhite'}>
        {subtitle}
      </Text>
      {children}
      <XStack ai={'center'} space={'$2'}>
        <Checkbox
          size={'small'}
          value={checkboxValue}
          onChange={() => {
            setCheckboxValue(!checkboxValue)
          }}
        />
        <Text fontSize={14} color={'$greyOnWhite'}>
          Save to profile for future use
        </Text>
      </XStack>
    </Stack>
  )
}

interface UsernameDialogProps {
  revealIdentityUsernameAtom: PrimitiveAtom<string>
  usernameSavedForFutureUseAtom: PrimitiveAtom<boolean>
}

export function UsernameDialogContent({
  revealIdentityUsernameAtom,
  usernameSavedForFutureUseAtom,
}: UsernameDialogProps): JSX.Element {
  const {t} = useTranslation()
  const realUserName = useAtomValue(realUserNameAtom)
  const [revealIdentityUsername, setRevealIdentityUsername] = useAtom(
    revealIdentityUsernameAtom
  )

  useEffect(() => {
    setRevealIdentityUsername(realUserName ?? '')
  }, [realUserName, setRevealIdentityUsername])

  return (
    <Content
      checkboxValueAtom={usernameSavedForFutureUseAtom}
      title={t('messages.identityRevealDialog.username')}
      subtitle={t('messages.identityRevealDialog.inOrderToRevealIdentity')}
    >
      <TextInput
        value={revealIdentityUsername}
        placeholder={
          realUserName ?? t('messages.identityRevealDialog.username')
        }
        onChangeText={setRevealIdentityUsername}
      />
    </Content>
  )
}

interface ImageDialogProps {
  imageSavedForFutureUseAtom: PrimitiveAtom<boolean>
  revealIdentityImageUriAtom: PrimitiveAtom<UriString | undefined>
}

export function ImageDialogContent({
  imageSavedForFutureUseAtom,
  revealIdentityImageUriAtom,
}: ImageDialogProps): JSX.Element {
  const {t} = useTranslation()
  const realUserImage = useAtomValue(realUserImageAtom)
  const setRevealIdentityImageUri = useSetAtom(revealIdentityImageUriAtom)

  useEffect(() => {
    setRevealIdentityImageUri(realUserImage?.imageUri)
  }, [realUserImage?.imageUri, setRevealIdentityImageUri])

  return (
    <Content
      title={t('messages.identityRevealDialog.chooseYourPicture')}
      subtitle={t('messages.identityRevealDialog.selectPictureToBeUsed')}
      checkboxValueAtom={imageSavedForFutureUseAtom}
    >
      <Stack f={1} ai={'center'} jc={'center'}>
        <SelectProfilePicture
          selectedImageUriAtom={revealIdentityImageUriAtom}
        />
      </Stack>
    </Content>
  )
}
