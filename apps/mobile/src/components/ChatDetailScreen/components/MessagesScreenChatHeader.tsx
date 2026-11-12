import {useNavigation} from '@react-navigation/native'
import {ChevronLeft, NavigationBar, Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {getOtherSideRealNameOrFriendLevel} from '../../../utils/chat/getOtherSideFriendLevel'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTrustedFriendsText} from '../../../utils/localization/useTrustedFriendsText'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import useChatHeaderRightActions from './useChatHeaderRightActions'
import useOtherSideAvatarPress from './useOtherSideAvatarPress'

export function MessagesScreenChatHeader(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)

  const {
    chatAtom,
    commonConnectionsCountAtom,
    trustedConnectionsCountAtom,
    friendLevelInfoAtom,
    offerForChatAtom,
    otherSideDataAtom,
    publicKeyPemBase64Atom,
    shouldGrayScaleAvatarAtom,
  } = useMolecule(chatMolecule)
  const trustedFriendsText = useTrustedFriendsText(
    useAtomValue(trustedConnectionsCountAtom)
  )
  const chat = useAtomValue(chatAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const friendLevelInfo = useAtomValue(friendLevelInfoAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const shouldGrayScaleAvatar = useAtomValue(shouldGrayScaleAvatarAtom)
  const rightActions = useChatHeaderRightActions()
  const onAvatarPress = useOtherSideAvatarPress()

  return (
    <Stack
      backgroundColor="$backgroundSecondary"
      borderBottomColor="$backgroundPrimary"
      borderBottomWidth="$0.5"
    >
      <NavigationBar
        style="chat"
        name={
          getOtherSideRealNameOrFriendLevel({
            friendLevel: friendLevelInfo,
            offerInfo: offer?.offerInfo,
            chat,
            t,
          }) ?? otherSideData.userName
        }
        trustedFriends={trustedFriendsText}
        subtitle={t('offer.numberOfCommon', {
          number: formatInteger(commonConnectionsCount, locale),
        })}
        leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        avatar={
          <TouchableOpacity onPress={onAvatarPress}>
            <UserAvatar
              grayScale={shouldGrayScaleAvatar}
              userImage={otherSideData.image}
              width={40}
              height={40}
            />
          </TouchableOpacity>
        }
        onPress={() => {
          navigation.navigate('ChatInfo', {
            inboxKey,
            otherSideKey: chat.otherSide.publicKey,
          })
        }}
        rightActions={rightActions}
      />
    </Stack>
  )
}
