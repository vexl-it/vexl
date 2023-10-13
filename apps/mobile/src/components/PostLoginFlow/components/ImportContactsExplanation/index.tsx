import {type PostLoginFlowScreenProps} from '../../../../navigationTypes'
import {ScopeProvider} from 'jotai-molecules'
import {ContactsSelectScope} from '../../../ContactListSelect/atom'
import ImportContactsExplanationContent from './components/ImportContactsExplanationContent'

type Props = PostLoginFlowScreenProps<'ImportContactsExplanation'>
export default function ImportContactsExplanation({
  navigation,
}: Props): JSX.Element {
  return (
    <ScopeProvider
      scope={ContactsSelectScope}
      value={ContactsSelectScope.defaultValue}
    >
      <ImportContactsExplanationContent
        onContactsSubmitted={() => {
          navigation.push('AllowNotificationsExplanation')
        }}
      />
    </ScopeProvider>
  )
}
