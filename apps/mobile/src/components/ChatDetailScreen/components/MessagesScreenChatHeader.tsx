import {useNavigation} from '@react-navigation/native'
import {Checklist, ChevronLeft, NavigationBar, Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {getChatDisplayName} from '../../../utils/chat/getChatDisplayName'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {showGoldenAvatarInfoModalActionAton} from '../../GoldenAvatar/atoms'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'

export function MessagesScreenChatHeader(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const navigation = useNavigation()
  const {t} = useTranslation()

  const {
    canSendMessagesAtom,
    chatIdAtom,
    commonConnectionsCountAtom,
    offerForChatAtom,
    openedImageUriAtom,
    otherSideDataAtom,
    otherSideGoldenAvatarTypeAtom,
    otherSideLeftAtom,
    publicKeyPemBase64Atom,
  } = useMolecule(chatMolecule)
  const chatId = useAtomValue(chatIdAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideGoldenAvatarType = useAtomValue(otherSideGoldenAvatarTypeAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const setOpenedImageUri = useSetAtom(openedImageUriAtom)
  const showGoldenAvatarInfoModal = useSetAtom(
    showGoldenAvatarInfoModalActionAton
  )

  const noImageUri =
    otherSideData.image.type === 'imageUri' && !otherSideData.image.imageUri
  const noGoldenAvatarType =
    !otherSideGoldenAvatarType ||
    (!offer?.ownershipInfo && !offer?.offerInfo.publicPart.goldenAvatarType)

  return (
    <Stack
      backgroundColor="$backgroundSecondary"
      borderBottomColor="$backgroundPrimary"
      borderBottomWidth="$0.5"
    >
      <NavigationBar
        style="chat"
        name={
          getChatDisplayName({
            offerInfo: offer?.offerInfo,
            userName: otherSideData.userName,
            t,
          }) ?? otherSideData.userName
        }
        subtitle={t('offer.numberOfCommon', {number: commonConnectionsCount})}
        leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        avatar={
          <TouchableOpacity
            disabled={noImageUri || noGoldenAvatarType}
            onPress={() => {
              if (otherSideData.image.type === 'imageUri')
                setOpenedImageUri(resolveLocalUri(otherSideData.image.imageUri))
              else if (
                !!otherSideGoldenAvatarType ||
                (!offer?.ownershipInfo &&
                  offer?.offerInfo.publicPart.goldenAvatarType)
              )
                showGoldenAvatarInfoModal()
            }}
          >
            <UserAvatar
              grayScale={otherSideLeft || !canSendMessages}
              userImage={otherSideData.image}
              width={40}
              height={40}
            />
          </TouchableOpacity>
        }
        onPress={() => {
          // TODO
        }}
        rightActions={[
          {
            icon: Checklist,
            onPress: () => {
              navigation.navigate('TradeChecklistFlow', {
                screen: 'AgreeOnTradeDetails',
                chatId,
                inboxKey,
              })
            },
          },
        ]}
      />
    </Stack>
  )
}
