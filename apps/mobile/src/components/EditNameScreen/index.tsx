import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {useTranslation} from '../../utils/localization/I18nProvider'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {getTokens, Stack} from 'tamagui'
import {useState} from 'react'
import {useAtom} from 'jotai'
import {userNameAtom} from '../../state/session'
import Input from '../Input'
import Button from '../Button'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import {UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {Alert} from 'react-native'

function EditNameScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const tokens = getTokens()
  const [userName, setUserName] = useAtom(userNameAtom)

  const [name, setName] = useState<string>(userName)

  return (
    <Screen customHorizontalPadding={tokens.space[2].val}>
      <KeyboardAvoidingView>
        <ScreenTitle text={t('editName.editName')}>
          <IconButton variant={'dark'} icon={closeSvg} onPress={safeGoBack} />
        </ScreenTitle>
        <Stack f={1}>
          <Input
            variant={'greyOnBlack'}
            textColor={'$white'}
            value={name}
            onChangeText={setName}
            showClearButton={!!name}
            onClearPress={() => {
              setName('')
            }}
          />
        </Stack>
        <Stack pb={'$3'}>
          <Button
            onPress={() => {
              const parsedUserName = UserName.safeParse(name.trim())
              if (!parsedUserName.success) {
                Alert.alert(t('editName.errorUserNameNotValid'))
                return
              }
              setUserName(parsedUserName.data)
              safeGoBack()
            }}
            variant={'secondary'}
            text={t('common.save')}
          />
        </Stack>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default EditNameScreen
