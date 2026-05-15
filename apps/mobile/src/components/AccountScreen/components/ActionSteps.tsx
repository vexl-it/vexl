import {useNavigation} from '@react-navigation/native'
import {StepperCheck, StepperCheckContainer} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {importedContactsCountAtom} from '../../../state/contacts/atom/contactsStore'
import {
  hasPostedFirstOfferActionStepAtom,
  postedFirstOfferAtom,
} from '../../../state/marketplace/atoms/myOffers'
import {areRealUserDataSet} from '../../../state/session/userDataAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'

export function ActionSteps(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'Account'>['navigation']>()
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const realUserDataSet = useAtomValue(areRealUserDataSet)
  const hasPostedFirstOffer = useAtomValue(hasPostedFirstOfferActionStepAtom)
  const setPostedFirstOffer = useSetAtom(postedFirstOfferAtom)

  useEffect(() => {
    if (hasPostedFirstOffer) {
      setPostedFirstOffer(true)
    }
  }, [hasPostedFirstOffer, setPostedFirstOffer])

  const navigateToContacts = useCallback(() => {
    navigation.navigate('ContactPreferences')
  }, [navigation])

  const navigateToIdentity = useCallback(() => {
    navigation.navigate('EditIdentity')
  }, [navigation])

  const navigateToCreateOffer = useCallback(() => {
    navigation.navigate('CRUDOfferFlow')
  }, [navigation])

  if (importedContactsCount > 0 && realUserDataSet && hasPostedFirstOffer) {
    return null
  }

  return (
    <StepperCheckContainer>
      <StepperCheck
        selected={importedContactsCount > 0}
        label={t('account.actionSteps.addContacts.title')}
        note={t('account.actionSteps.addContacts.description')}
        onPress={navigateToContacts}
      />
      <StepperCheck
        selected={realUserDataSet}
        label={t('account.actionSteps.setIdentity.title')}
        note={t('account.actionSteps.setIdentity.description')}
        onPress={navigateToIdentity}
      />
      <StepperCheck
        selected={hasPostedFirstOffer}
        last
        label={t('account.actionSteps.postFirstOffer.title')}
        note={t('account.actionSteps.postFirstOffer.description')}
        onPress={navigateToCreateOffer}
      />
    </StepperCheckContainer>
  )
}
