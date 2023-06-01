import {ScopeProvider} from 'jotai-molecules'
import {ChangeProfilePictureScope} from './index'
import * as O from 'fp-ts/Option'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'

interface Props {
  children: React.ReactNode
  changeProfilePictureScopeValue?: O.Option<UriString>
}

function ChangeProfilePictureScopeProvider({
  changeProfilePictureScopeValue,
  children,
}: Props): JSX.Element {
  return (
    <ScopeProvider
      scope={ChangeProfilePictureScope}
      value={changeProfilePictureScopeValue ?? O.none}
    >
      {children}
    </ScopeProvider>
  )
}

export default ChangeProfilePictureScopeProvider
