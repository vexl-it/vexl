import {XStack} from 'tamagui'
import Button from '../../Button'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {Alert} from 'react-native'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {useSetAtom} from 'jotai'
import acceptMessagingRequestAtom from '../../../state/chat/atoms/acceptMessagingRequestAtom'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'

function AccepDeclineButtons({
  onDone = () => {},
}: {
  onDone?: (accept: boolean) => void
}): JSX.Element {
  const {t} = useTranslation()
  const {chatWithMessagesAtom} = useMolecule(chatMolecule)
  const approveChat = useSetAtom(acceptMessagingRequestAtom)
  const loadingOverlay = useShowLoadingOverlay()

  function approve(accept: boolean): () => void {
    return () => {
      loadingOverlay.show()
      void pipe(
        approveChat({
          approve: accept,
          chatAtom: chatWithMessagesAtom,
          text: accept ? 'approved' : 'disapproved',
        }),
        TE.match(
          (e) => {
            console.log(e)
            loadingOverlay.hide()
            Alert.alert('Error. TODO') // TODO error handling
          },
          () => {
            loadingOverlay.hide()
            onDone(accept)
          }
        )
      )()
    }
  }

  return (
    <XStack space="$4">
      <Button
        onPress={approve(false)}
        fullSize
        variant={'primary'}
        text={t('common.decline')}
      />
      <Button
        onPress={approve(true)}
        variant={'secondary'}
        fullSize
        text={t('common.accept')}
      />
    </XStack>
  )
}

export default AccepDeclineButtons
