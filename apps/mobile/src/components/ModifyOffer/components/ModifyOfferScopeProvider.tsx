import {type OneOfferInState} from '../../../state/marketplace/domain'
import {OfferFormScope} from '../atoms/offerFormStateAtoms'
import {ScopeProvider} from 'jotai-molecules'

interface Props {
  children: React.ReactNode
  modifyOfferScopeValue?: OneOfferInState
}
function ModifyOfferScopeProvider({
  children,
  modifyOfferScopeValue,
}: Props): JSX.Element {
  return (
    <ScopeProvider
      scope={OfferFormScope}
      value={modifyOfferScopeValue ?? 'newOfferCreation'}
    >
      {children}
    </ScopeProvider>
  )
}

export default ModifyOfferScopeProvider
