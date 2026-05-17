import {useNavigationState} from '@react-navigation/native'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {
  Button,
  ChevronLeft,
  KeyboardAvoidingView,
  NavigationBar,
  Screen,
  TextField,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Option, Schema} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import {type EditIdentityStackScreenProps} from '../../../navigationTypes'
import {invalidUsernameUIFeedbackAtom} from '../../../state/session/userDataAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {editProfileIdentityNicknameAtom} from '../atoms/editIdentityAtoms'

type Props = EditIdentityStackScreenProps<'EditIdentityNickname'>

function EditIdentityNicknameScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const previousRouteName = useNavigationState(
    (state) => state.routes[state.index - 1]?.name
  )
  const nickname = useAtomValue(editProfileIdentityNicknameAtom)
  const showInvalidUsernameUIFeedback = useSetAtom(
    invalidUsernameUIFeedbackAtom
  )

  const closeFlow = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  const goBack = useCallback(() => {
    if (previousRouteName == null) {
      navigation.navigate('EditIdentityPhoto')
      return
    }

    navigation.goBack()
  }, [navigation, previousRouteName])

  const handleNext = useCallback(() => {
    const parsedUserName = Schema.decodeUnknownOption(UserName)(nickname.trim())

    if (Option.isNone(parsedUserName)) {
      void showInvalidUsernameUIFeedback()
      return
    }

    navigation.navigate('EditIdentitySummary')
  }, [navigation, nickname, showInvalidUsernameUIFeedback])

  return (
    <KeyboardAvoidingView>
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('editProfileScreen.nickname.title')}
            leftAction={{
              icon: ChevronLeft,
              onPress: goBack,
            }}
            rightActions={[
              {
                icon: XmarkCancelClose,
                onPress: closeFlow,
              },
            ]}
          />
        }
        footer={
          <Button disabled={!nickname.trim()} onPress={handleNext}>
            {t('editProfileScreen.nickname.nextButton')}
          </Button>
        }
      >
        <Stack flex={1} gap="$7" paddingTop="$4">
          <Typography variant="description" color="$foregroundSecondary">
            {t('editProfileScreen.nickname.description')}
          </Typography>
          <TextField
            autoFocus
            valueAtom={editProfileIdentityNicknameAtom}
            placeholder={t('editProfileScreen.nickname.placeholder')}
            showClear
          />
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  )
}

export default EditIdentityNicknameScreen
