import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {useAtom, useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import React, {useEffect, type ReactNode} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {
  realUserImageAtom,
  realUserNameAtom,
} from '../../state/session/userDataAtoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Checkbox from '../Checkbox'
import TextInput from '../Input'
import SelectProfilePicture from '../SelectProfilePicture'

interface ContentProps {
  checkboxDisabled?: boolean
  children: ReactNode
  title: string
  subtitle: string
  checkboxValueAtom: PrimitiveAtom<boolean>
}

function Content({
  checkboxDisabled,
  checkboxValueAtom,
  children,
  title,
  subtitle,
}: ContentProps): React.ReactElement {
  const {t} = useTranslation()
  const [checkboxValue, setCheckboxValue] = useAtom(checkboxValueAtom)

  return (
    <Stack gap="$2">
      <Text fontFamily="$heading" fontSize={24} color="$black">
        {title}
      </Text>
      <Text fontSize={18} color="$greyOnWhite">
        {subtitle}
      </Text>
      {children}
      <TouchableOpacity
        disabled={checkboxDisabled}
        onPress={() => {
          setCheckboxValue(!checkboxValue)
        }}
      >
        <XStack ai="center" gap="$2">
          <Checkbox
            disabled={checkboxDisabled}
            value={checkboxValue}
            onChange={() => {
              setCheckboxValue(!checkboxValue)
            }}
          />
          <Text
            fontSize={14}
            color={checkboxDisabled ? '$greyOnBlack' : '$greyOnWhite'}
          >
            {t('messages.identityRevealDialog.saveForFutureUse')}
          </Text>
        </XStack>
      </TouchableOpacity>
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
}: UsernameDialogProps): React.ReactElement {
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
      checkboxDisabled={!revealIdentityUsername}
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
}: ImageDialogProps): React.ReactElement {
  const {t} = useTranslation()
  const realUserImage = useAtomValue(realUserImageAtom)
  const setRevealIdentityImageUri = useSetAtom(revealIdentityImageUriAtom)
  const revealIdentityImageUri = useAtomValue(revealIdentityImageUriAtom)

  useEffect(() => {
    setRevealIdentityImageUri(realUserImage?.imageUri)
  }, [realUserImage?.imageUri, setRevealIdentityImageUri])

  return (
    <Content
      title={t('messages.identityRevealDialog.chooseYourPicture')}
      subtitle={t('messages.identityRevealDialog.selectPictureToBeUsed')}
      checkboxDisabled={!revealIdentityImageUri}
      checkboxValueAtom={imageSavedForFutureUseAtom}
    >
      <Stack f={1} ai="center" jc="center">
        <SelectProfilePicture
          selectedImageUriAtom={revealIdentityImageUriAtom}
        />
      </Stack>
    </Content>
  )
}
