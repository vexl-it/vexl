import WhiteContainer from '../../../../WhiteContainer'
import AnonymizationCaption from '../../../../AnonymizationCaption/AnonymizationCaption'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../../PageWithButtonAndProgressHeader'
import {Stack, Text} from 'tamagui'
import {Image} from 'react-native'
import {useAtomValue, useSetAtom} from 'jotai'
import {
  contactsLoadingAtom,
  triggerContactsReloadAtom,
} from '../../../../../state/contacts/atom/contactsFromDeviceAtom'
import {useMolecule} from 'jotai-molecules'
import {contactSelectMolecule} from '../../../../ContactListSelect/atom'
import {useOnFocusAndAppState} from '../../../../ContactListSelect/utils'
import {useCallback, useEffect} from 'react'
import {useShowLoadingOverlay} from '../../../../LoadingOverlayProvider'

interface Props {
  onContactsSubmitted: () => void
}

export default function ImportContactsExplanationContent({
  onContactsSubmitted,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const contactsLoading = useAtomValue(contactsLoadingAtom)
  const {selectAllAtom, submitActionAtom} = useMolecule(contactSelectMolecule)
  const submit = useSetAtom(submitActionAtom)
  const selectAll = useSetAtom(selectAllAtom)
  const triggerContactsReload = useSetAtom(triggerContactsReloadAtom)
  const loadingOverlay = useShowLoadingOverlay()

  useOnFocusAndAppState(
    useCallback(() => {
      triggerContactsReload()
    }, [triggerContactsReload])
  )

  useEffect(() => {
    if (contactsLoading) {
      loadingOverlay.show()
    } else {
      loadingOverlay.hide()
    }
  }, [contactsLoading, loadingOverlay])

  return (
    <WhiteContainer>
      <Stack f={1} jc="space-between">
        <HeaderProxy showBackButton={false} progressNumber={3} />
        <Stack f={1} ai={'center'} mb="$4">
          <Image
            style={{height: '100%', width: '100%'}}
            resizeMode={'contain'}
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
            selectAll(true)
            void submit()().then((success) => {
              if (success) onContactsSubmitted()
            })
          }}
          disabled={contactsLoading}
        />
      </Stack>
    </WhiteContainer>
  )
}
