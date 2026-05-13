import {ContactsGraphic, YStack} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {type PostLoginFlowStackScreenProps} from '../../../navigationTypes'
import {resolveAllContactsAsSeenActionAtom} from '../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../state/contacts/atom/submitContactsActionAtom'
import {completePostLoginFlowScreenActionAtom} from '../../../state/postLoginOnboarding'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {showContactsAccessDeniedExplanationActionAtom} from '../atoms/showContactsAccesDeniedExplanationActionAtom'
import PostLoginFlowScreen, {PostLoginFlowCopy} from './PostLoginFlowScreen'

type Props = PostLoginFlowStackScreenProps<'ContactsImport'>

export default function ContactsImportScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const graphicScale = Math.min(1, availableWidth / 184)
  const [contactsLoading, setContactsLoading] = useState(false)
  const submitContacts = useSetAtom(submitContactsActionAtom)
  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const showContactsAccessDeniedExplanation = useSetAtom(
    showContactsAccessDeniedExplanationActionAtom
  )
  const completeScreen = useSetAtom(completePostLoginFlowScreenActionAtom)

  const goNext = (): void => {
    completeScreen('contactsImport')
    navigation.navigate('NotificationSetup')
  }

  return (
    <PostLoginFlowScreen
      primaryButton={{
        disabled: contactsLoading,
        label: t('postLoginFlow.v2.contactsImport.action'),
        onPress: () => {
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
              ).then(goNext)
              return
            }

            goNext()
          })
        },
      }}
      secondaryButton={{
        disabled: contactsLoading,
        label: t('postLoginFlow.v2.contactsImport.skip'),
        onPress: goNext,
      }}
    >
      <YStack alignItems="center" flex={1} justifyContent="center" gap="$9">
        <ContactsGraphic
          animate
          height={214 * graphicScale}
          width={184 * graphicScale}
        />
        <PostLoginFlowCopy
          text={t('postLoginFlow.v2.contactsImport.text')}
          title={t('postLoginFlow.v2.contactsImport.title')}
        />
      </YStack>
    </PostLoginFlowScreen>
  )
}
