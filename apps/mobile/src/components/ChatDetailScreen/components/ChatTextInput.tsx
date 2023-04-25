import TextInput from '../../Input'
import IconButton from '../../IconButton'
import sendSvg from '../images/sendSvg'
import {getTokens} from 'tamagui'
import {StyleSheet} from 'react-native'
import {useCallback, useState} from 'react'
import Animated, {useAnimatedStyle, withSpring} from 'react-native-reanimated'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useSetAtom} from 'jotai'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {useTranslation} from '../../../utils/localization/I18nProvider'

const styles = StyleSheet.create({
  textInput: {
    paddingTop: 5,
    paddingBottom: getTokens().space[2].val,
    paddingLeft: getTokens().space[3].val,
    paddingRight: getTokens().space[2].val,
  },
})

function ChatTextInput(): JSX.Element | null {
  const [value, setValue] = useState('')
  const {sendMessageAtom} = useMolecule(chatMolecule)
  const sendMessage = useSetAtom(sendMessageAtom)
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()

  const animatedStyle = useAnimatedStyle(() => {
    return {opacity: withSpring(value ? 1 : 0)}
  }, [value])

  const sendText = useCallback(() => {
    if (!value.trim()) return

    const message: ChatMessage = {
      text: value,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      messageType: 'MESSAGE',
      senderPublicKey: session.privateKey.publicKeyPemBase64,
    }
    setValue('')
    void sendMessage(message)()
  }, [session, value, sendMessage])

  return (
    <TextInput
      multiline
      value={value}
      onChangeText={setValue}
      style={styles.textInput}
      textColor={'$white'}
      variant={'greyOnBlack'}
      borderRadius={'$8'}
      placeholder={t('messages.typeSomething')}
      placeholderTextColor={getTokens().color.greyOnBlack.val}
      rightElement={
        <Animated.View style={animatedStyle}>
          <IconButton
            oval
            variant="secondary"
            icon={sendSvg}
            onPress={sendText}
          />
        </Animated.View>
      }
    />
  )
}

export default ChatTextInput
