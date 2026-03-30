import {useNavigation} from '@react-navigation/native'
import {Checklist, ChevronLeft, NavButton} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {Stack, XStack} from 'tamagui'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {chatMolecule} from '../atoms'
import OtherSideNamePhotoAndInfo from './OtherSideNamePhotoAndInfo'

export function MessagesScreenChatHeader(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const navigation = useNavigation()

  const {chatIdAtom, publicKeyPemBase64Atom} = useMolecule(chatMolecule)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)

  return (
    <XStack
      backgroundColor="$backgroundSecondary"
      py="$4"
      px="$5"
      gap="$3"
      borderBottomColor="$backgroundPrimary"
      borderBottomWidth="$0.5"
    >
      <NavButton
        icon={ChevronLeft}
        variant="highlighted"
        onPress={safeGoBack}
      />
      <Stack f={1}>
        <OtherSideNamePhotoAndInfo mode="photoLeft" />
      </Stack>
      <NavButton
        onPress={() => {
          navigation.navigate('TradeChecklistFlow', {
            screen: 'AgreeOnTradeDetails',
            chatId,
            inboxKey,
          })
        }}
        icon={Checklist}
        variant="tetriary"
      />
    </XStack>
  )
}
