import {useMolecule} from 'bunshi/dist/react'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import {Alert} from 'react-native'
import {XStack} from 'tamagui'
import acceptMessagingRequestAtom from '../../../state/chat/atoms/acceptMessagingRequestAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import Button from '../../Button'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {chatMolecule} from '../atoms'

function AcceptDeclineButtons({
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
            loadingOverlay.hide()
            if (e._tag === 'RequestCancelledError') {
              Alert.alert(t('offer.requestWasCancelledByOtherSide'))
            } else if (e._tag === 'RequestNotFoundError') {
              Alert.alert(t('offer.requestNotFound'))
            } else if (e._tag === 'ReceiverInboxDoesNotExistError') {
              Alert.alert(t('offer.otherSideAccountDeleted'))
            } else {
              showErrorAlert({
                title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
                error: e,
              })
            }
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
    <XStack gap="$4">
      <Button
        onPress={approve(false)}
        fullSize
        variant="primary"
        text={t('common.decline')}
      />
      <Button
        onPress={approve(true)}
        variant="secondary"
        fullSize
        text={t('common.accept')}
      />
    </XStack>
  )
}

export default AcceptDeclineButtons
