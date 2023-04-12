import {ActivityIndicator, Modal} from 'react-native'
import {Stack, Text} from 'tamagui'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {
  connectionLevelAtom,
  secondDegreeFriendsCountAtom,
} from '../../state/atom'
import {useEffect, useState} from 'react'
import {useContactsToDisplay} from '../../../ContactListSelect/state/contactsToDisplay'

interface Props {
  loading: boolean
  visible: boolean
}

function OfferEncryptionProgress({loading, visible}: Props): JSX.Element {
  const {t} = useTranslation()
  const contactsToDisplay = useContactsToDisplay()
  const {bottom} = useSafeAreaInsets()
  const [
    selectedConnectionLevelFriendsCount,
    setSelectedConnectionLevelFriendsCount,
  ] = useState<number>(0)
  const secondDegreeFriendsCount = useAtomValue(secondDegreeFriendsCountAtom)
  const connectionLevel = useAtomValue(connectionLevelAtom)

  useEffect(() => {
    if (connectionLevel === 'FIRST') {
      setSelectedConnectionLevelFriendsCount(contactsToDisplay.length)
    } else {
      setSelectedConnectionLevelFriendsCount(secondDegreeFriendsCount)
    }
  }, [connectionLevel, contactsToDisplay.length, secondDegreeFriendsCount])

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Stack f={1} pb={bottom} jc="flex-end" bc={'rgba(0,0,0,0.6)'}>
        <Stack mb={bottom} p="$4" backgroundColor="$white" br="$4">
          <Text pb="$4" fos={32} ff="$heading">
            {loading
              ? t('createOffer.offerEncryption.encryptingYourOffer')
              : t('createOffer.offerEncryption.doneOfferPoster')}
          </Text>
          {loading && <ActivityIndicator />}
          <Text ff="$body600" fos={14} col="$black">
            {loading
              ? t('createOffer.offerEncryption.forVexlers', {
                  count: selectedConnectionLevelFriendsCount,
                })
              : t('createOffer.offerEncryption.anonymouslyDeliveredToVexlers', {
                  count: selectedConnectionLevelFriendsCount,
                })}
          </Text>
          <Text pt="$4" fos={18} col="$greyOnWhite">
            {loading
              ? t('createOffer.offerEncryption.dontShutDownTheApp')
              : t('createOffer.offerEncryption.yourFriendsAndFriendsOfFriends')}
          </Text>
        </Stack>
      </Stack>
    </Modal>
  )
}

export default OfferEncryptionProgress
