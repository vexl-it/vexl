import Screen from '../Screen'
import * as O from 'fp-ts/Option'
import {useAtomValue} from 'jotai'
import {userImageAtom} from '../../state/session'
import ChangeProfilePictureScreenContent from './ChangeProfilePictureScreenContent'
import {getTokens} from 'tamagui'
import ChangeProfilePictureScopeProvider from '../ChangeProfilePictureScope/Provider'

function ChangeProfilePictureScreen(): JSX.Element {
  const tokens = getTokens()
  const userImage = useAtomValue(userImageAtom)

  return (
    <Screen customHorizontalPadding={tokens.space[2].val}>
      <ChangeProfilePictureScopeProvider
        changeProfilePictureScopeValue={
          userImage ? O.some(userImage.imageUri) : O.none
        }
      >
        <ChangeProfilePictureScreenContent />
      </ChangeProfilePictureScopeProvider>
    </Screen>
  )
}

export default ChangeProfilePictureScreen
