import Screen from '../../Screen'
import React from 'react'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {ScopeProvider} from 'jotai-molecules'
import {OfferFormStateScope} from '../atoms/offerFormStateAtoms'
import CreateOfferContent from './CreateOfferContent'

type Props = RootStackScreenProps<'CreateOffer'>

function CreateOfferScreen({navigation}: Props): JSX.Element {
  return (
    <Screen customHorizontalPadding={0} customVerticalPadding={32}>
      <KeyboardAvoidingView>
        <ScopeProvider scope={OfferFormStateScope}>
          <CreateOfferContent
            navigateBack={() => {
              navigation.goBack()
            }}
            navigateToMarketplace={() => {
              navigation.navigate('MyOffers')
            }}
          />
        </ScopeProvider>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CreateOfferScreen
