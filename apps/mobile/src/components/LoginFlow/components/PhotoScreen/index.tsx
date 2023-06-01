import * as O from 'fp-ts/Option'
import PhotoScreenContent from './PhotoScreenContent'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import ChangeProfilePictureScopeProvider from '../../../ChangeProfilePictureScope/Provider'

type Props = LoginStackScreenProps<'Photo'>

function PhotoScreen({navigation, route}: Props): JSX.Element {
  return (
    <ChangeProfilePictureScopeProvider changeProfilePictureScopeValue={O.none}>
      <PhotoScreenContent navigation={navigation} route={route} />
    </ChangeProfilePictureScopeProvider>
  )
}

export default PhotoScreen
