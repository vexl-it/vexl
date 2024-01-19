import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {useTranslation} from '../../utils/localization/I18nProvider'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {getTokens, Stack} from 'tamagui'
import {useState} from 'react'
import {useAtom, useSetAtom} from 'jotai'
import Input from '../Input'
import Button from '../Button'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {
  invalidUsernameUIFeedbackAtom,
  realUserNameAtom,
} from '../../state/session'

function EditNameScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const tokens = getTokens()
  const showInvalidUsernameUIFeedback = useSetAtom(
    invalidUsernameUIFeedbackAtom
  )
  const [userName, setUserName] = useAtom(realUserNameAtom)

  const [name, setName] = useState<string>(() => userName ?? '')

  return (
    <Screen customHorizontalPadding={tokens.space[2].val}>
      <KeyboardAvoidingView>
        <ScreenTitle text={t('editName.editName')}>
          <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
        </ScreenTitle>
        <Stack f={1}>
          <Input
            autoFocus
            variant="greyOnBlack"
            textColor="$white"
            value={name}
            onChangeText={setName}
            showClearButton={!!name}
            onClearPress={() => {
              setName('')
            }}
          />
        </Stack>
        <Stack pb="$3" space="$2">
          <Button
            onPress={() => {
              const parsedUserName = UserName.safeParse(name.trim())
              if (!parsedUserName.success) {
                void showInvalidUsernameUIFeedback()
                return
              }
              setUserName(parsedUserName.data)
              safeGoBack()
            }}
            variant="secondary"
            text={t('common.save')}
          />
          <Button
            disabled={!userName}
            onPress={() => {
              setUserName(undefined)
              safeGoBack()
            }}
            variant="primary"
            text={t('editName.clearName')}
          />
        </Stack>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default EditNameScreen
