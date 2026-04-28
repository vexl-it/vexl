import {useNavigation} from '@react-navigation/native'
import {Button, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import type {XStackProps} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {chatMolecule} from '../atoms'

function AcceptDeclineButtons(props: XStackProps): React.ReactElement {
  const {t} = useTranslation()
  const {approveChatRequestActionAtom, chatAtom} = useMolecule(chatMolecule)
  const approveChat = useSetAtom(approveChatRequestActionAtom)
  const navigation =
    useNavigation<RootStackScreenProps<'DeclineChatRequest'>['navigation']>()
  const chat = useAtomValue(chatAtom)

  const onDeclinePress = (): void => {
    if (!chat) return

    navigation.navigate('DeclineChatRequest', {
      otherSideKey: chat.otherSide.publicKey,
      inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
    })
  }

  return (
    <XStack width="100%" gap="$3" {...props}>
      <Button
        size="large"
        onPress={onDeclinePress}
        flex={1}
        variant="secondary"
      >
        {t('common.decline')}
      </Button>
      <Button
        size="large"
        onPress={() => {
          Effect.runFork(approveChat({approve: true, message: 'TODO'}))
        }}
        variant="primary"
        flex={1}
      >
        {t('common.accept')}
      </Button>
    </XStack>
  )
}

export default AcceptDeclineButtons
