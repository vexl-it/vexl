import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {Image} from 'react-native'
import {Stack, Text} from 'tamagui'
import {type PostLoginFlowStackScreenProps} from '../../../../navigationTypes'
import {resolveAllContactsAsSeenActionAtom} from '../../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {finishPostLoginFlowActionAtom} from '../../../../state/postLoginOnboarding'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import WhiteContainer from '../../../WhiteContainer'
import {showContactsAccessDeniedExplanationActionAtom} from './atoms/showContactsAccesDeniedExplanationActionAtom'

type Props = PostLoginFlowStackScreenProps<'ImportContactsExplanationScreen'>

export default function ImportContactsExplanationScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [contactsLoading, setContactsLoading] = useState(false)
  const submitContacts = useSetAtom(submitContactsActionAtom)
  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const showContactsAccessDeniedExplanation = useSetAtom(
    showContactsAccessDeniedExplanationActionAtom
  )
  const finishPostLoginFlow = useSetAtom(finishPostLoginFlowActionAtom)

  return (
    <WhiteContainer testID="@importContactsExplanationScreen">
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
            void Effect.runPromise(
              submitContacts({
                normalizeAndImportAll: true,
                showOfferReencryptionDialog: false,
              })
            ).then((result) => {
              resolveAllContactsAsSeen()
              setContactsLoading(false)

              if (result === 'permissionsNotGranted') {
                void Effect.runPromise(
                  showContactsAccessDeniedExplanation()
                ).then(() => {
                  navigation.navigate('FindOffersInVexlClubsScreen')
                })
              }

              if (result === 'noContactsSelected')
                navigation.navigate('FindOffersInVexlClubsScreen')

              if (result === 'success') Effect.runFork(finishPostLoginFlow())

              // if (success) navigation.push('AllowNotificationsExplanation')
            })
          }}
          disabled={contactsLoading}
        />
      </Stack>
    </WhiteContainer>
  )
}
