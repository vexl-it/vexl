import Screen from '../../Screen'
import React from 'react'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import CreateOfferContent from './CreateOfferContent'
import ModifyOfferScopeProvider from './ModifyOfferScopeProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'

function CreateOfferScreen(): JSX.Element {
  const safeGoBack = useSafeGoBack()
  return (
    <Screen>
      <KeyboardAvoidingView>
        <ModifyOfferScopeProvider>
          <CreateOfferContent navigateBack={safeGoBack} />
        </ModifyOfferScopeProvider>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CreateOfferScreen
