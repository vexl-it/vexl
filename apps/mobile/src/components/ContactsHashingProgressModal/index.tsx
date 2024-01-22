import {useAtomValue} from 'jotai'
import {Modal} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {hashingInProgressAtom} from './atoms'
import ProgressIndicator from './components/ProgressIndicator'

function ContactsHashingProgressModal(): JSX.Element {
  const {t} = useTranslation()
  const {bottom} = useSafeAreaInsets()

  const hashingInProgress = useAtomValue(hashingInProgressAtom)

  return (
    <Modal animationType="fade" transparent visible={hashingInProgress}>
      <Stack f={1} pb={bottom} jc="flex-end" bc="rgba(0,0,0,0.6)">
        <Stack mb={bottom} p="$4" backgroundColor="$white" br="$4">
          <Text col="$black" pb="$4" fos={32} ff="$heading">
            {t('addContactDialog.processingContacts')}
          </Text>
          <ProgressIndicator />
          <Text pt="$4" fos={18} col="$greyOnWhite">
            {t('addContactDialog.dontShutDownTheApp')}
          </Text>
        </Stack>
      </Stack>
    </Modal>
  )
}

export default ContactsHashingProgressModal
