import Screen from '../../Screen'
import React from 'react'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import {type RootStackScreenProps} from '../../../navigationTypes'
import CreateOfferContent from './CreateOfferContent'
import ModifyOfferScopeProvider from './ModifyOfferScopeProvider'

type Props = RootStackScreenProps<'CreateOffer'>

function CreateOfferScreen({navigation}: Props): JSX.Element {
  return (
    <Screen customHorizontalPadding={0} customVerticalPadding={32}>
      <KeyboardAvoidingView>
        <ModifyOfferScopeProvider>
          <CreateOfferContent
            navigateBack={() => {
              navigation.goBack()
            }}
          />
        </ModifyOfferScopeProvider>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CreateOfferScreen
