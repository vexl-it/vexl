import {useSetAtom} from 'jotai'
import {useState} from 'react'
import {Image} from 'react-native'
import {Stack, Text} from 'tamagui'
import {resolveAllContactsAsSeenActionAtom} from '../../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {useFinishPostLoginFlow} from '../../../../state/postLoginOnboarding'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import WhiteContainer from '../../../WhiteContainer'

export default function ImportContactsExplanationContent(): JSX.Element {
  const {t} = useTranslation()
  const [contactsLoading, setContactsLoading] = useState(false)
  const submitContacts = useSetAtom(submitContactsActionAtom)
  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const finishPostLoginFlow = useFinishPostLoginFlow()

  return (
    <WhiteContainer testID="@importContactsExplanationContent">
      <Stack f={1} jc="space-between">
        <HeaderProxy showBackButton={false} progressNumber={3} />
        <Stack f={1} ai="center" mb="$4">
          <Image
            style={{height: '100%', width: '100%'}}
            resizeMode="contain"
            source={require('./image/importContacts.png')}
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
            setContactsLoading(true)
            void submitContacts({normalizeAndImportAll: true})().then(
              (success) => {
                resolveAllContactsAsSeen()
                setContactsLoading(false)
                if (success) finishPostLoginFlow()
                // if (success) navigation.push('AllowNotificationsExplanation')
              }
            )
          }}
          disabled={contactsLoading}
        />
      </Stack>
    </WhiteContainer>
  )
}
