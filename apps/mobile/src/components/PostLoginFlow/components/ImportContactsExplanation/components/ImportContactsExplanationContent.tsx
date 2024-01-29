import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Image} from 'react-native'
import {Stack, Text} from 'tamagui'
import {contactsLoadingAtom} from '../../../../../state/contacts/atom/contactsFromDeviceAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../../AnonymizationCaption/AnonymizationCaption'
import {contactSelectMolecule} from '../../../../ContactListSelect/atom'
import {useShowLoadingOverlay} from '../../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../../PageWithButtonAndProgressHeader'
import WhiteContainer from '../../../../WhiteContainer'

interface Props {
  onContactsSubmitted: () => void
}

export default function ImportContactsExplanationContent({
  onContactsSubmitted,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const contactsLoading = useAtomValue(contactsLoadingAtom)
  const {submitAllContactsOnStartupActionAtom} = useMolecule(
    contactSelectMolecule
  )
  const submitAllContactsOnStartup = useSetAtom(
    submitAllContactsOnStartupActionAtom
  )
  const loadingOverlay = useShowLoadingOverlay()

  useEffect(() => {
    if (contactsLoading) {
      loadingOverlay.show(t('contacts.loadingContacts'))
    } else {
      loadingOverlay.hide()
    }
  }, [contactsLoading, loadingOverlay, t])

  return (
    <WhiteContainer>
      <Stack f={1} jc="space-between">
        <HeaderProxy showBackButton={false} progressNumber={3} />
        <Stack f={1} ai="center" mb="$4">
          <Image
            style={{height: '100%', width: '100%'}}
            resizeMode="contain"
            source={require('../image/importContacts.png')}
          />
        </Stack>
        <Stack jc="space-around">
          <Stack>
            <Text col="$black" mb="$3" fos={24} ff="$heading">
              {t('postLoginFlow.contactsExplanation.title')}
            </Text>
          </Stack>
          <Text fos={16} ff="$body500" mb="$6" col="$greyOnWhite">
            {t('postLoginFlow.contactsExplanation.text')}
          </Text>
          <AnonymizationCaption
            fontSize={16}
            text={t('postLoginFlow.contactsExplanation.anonymizationCaption')}
          />
        </Stack>
        <NextButtonProxy
          text={t('postLoginFlow.importContactsButton')}
          onPress={() => {
            void submitAllContactsOnStartup()().then((success) => {
              if (success) onContactsSubmitted()
            })
          }}
          disabled={contactsLoading}
        />
      </Stack>
    </WhiteContainer>
  )
}
