import {useNavigation} from '@react-navigation/native'
import {Button, Checklist, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {chatMolecule} from '../atoms'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

export function VexlBotRequestHelp({
  message,
}: {
  message: ChatMessageWithState
}): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {
    chatAtom,
    commonConnectionsHashesAtom,
    publicKeyPemBase64Atom,
    chatStateAtom,
    verifiedConnectionsHashesAtom,
    canBeRerequestedAtom,
  } = useMolecule(chatMolecule)
  const chat = useAtomValue(chatAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const canBeRerequested = useAtomValue(canBeRerequestedAtom)
  const chatState = useAtomValue(chatStateAtom)

  const handleOfferDetailsPress = useCallback(() => {
    navigation.navigate('ChatOfferDetail', {
      inboxKey,
      otherSideKey: chat.otherSide.publicKey,
    })
  }, [chat.otherSide.publicKey, inboxKey, navigation])

  const handleCommonFriendsPress = useCallback(() => {
    navigation.navigate('CommonFriends', {
      contactsHashes: commonConnectionsHashes,
      verifiedHashes: verifiedConnectionsHashes,
    })
  }, [commonConnectionsHashes, navigation, verifiedConnectionsHashes])

  if (
    message.message.messageType === 'APPROVE_MESSAGING' &&
    chatState === 'chatOpen'
  ) {
    return (
      <VexlbotActionCard
        mt="$2"
        managedHidingId={message.message.uuid}
        description={t('messages.vexlBot.chatOpened')}
      >
        <Button
          f={1}
          variant="secondary"
          size="medium"
          icon={Checklist}
          onPress={() => {
            navigation.navigate('TradeChecklistFlow', {
              screen: 'AgreeOnTradeDetails',
              chatId: chat.id,
              inboxKey,
            })
          }}
        >
          {t('vexlbot.openTradeChecklist')}
        </Button>
      </VexlbotActionCard>
    )
  }

  if (chatState === 'chatOpen') return null

  if (message.message.messageType === 'REQUEST_MESSAGING') {
    if (message.state === 'received') {
      // Other side sent the request messaging
      return (
        <VexlbotActionCard
          title={t('messages.vexlBot.welcomeToTheTradeChat.title')}
          description={t(
            'messages.vexlBot.welcomeToTheTradeChat.receiverDescription'
          )}
        >
          <XStack gap="$3">
            <Button
              f={1}
              variant="secondary"
              size="medium"
              onPress={handleOfferDetailsPress}
            >
              {t('comomn.offerDetails')}
            </Button>

            <Button
              f={1}
              variant="secondary"
              size="medium"
              onPress={handleCommonFriendsPress}
            >
              {t('common.commonFriends')}
            </Button>
          </XStack>
        </VexlbotActionCard>
      )
    } else {
      const description = t(
        'messages.vexlBot.welcomeToTheTradeChat.senderDescriptionFirst'
      )
      const rerequestIn = canBeRerequested.canBeRerequested
        ? t(
            'messages.vexlBot.welcomeToTheTradeChat.senderDescriptionRerequestTimeout'
          )
        : null
      // I sent the request
      return (
        <VexlbotActionCard
          title={t('messages.vexlBot.welcomeToTheTradeChat.title')}
          description={`${description}${rerequestIn ? ` ${rerequestIn}` : ''}`}
        />
      )
    }
  }

  return null
}
