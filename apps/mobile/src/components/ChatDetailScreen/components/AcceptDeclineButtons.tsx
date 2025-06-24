import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Button from '../../Button'
import {chatMolecule} from '../atoms'

function AcceptDeclineButtons(): JSX.Element {
  const {t} = useTranslation()
  const {approveChatRequestActionAtom} = useMolecule(chatMolecule)
  const approveChat = useSetAtom(approveChatRequestActionAtom)
  // const loadingOverlay = useShowLoadingOverlay()

  // function approve(accept: boolean): () => void {
  //   return () => {
  //     loadingOverlay.show()
  //     void pipe(
  //       approveChat({
  //         approve: accept,
  //         chatAtom: chatWithMessagesAtom,
  //         text: accept ? 'approved' : 'disapproved',
  //       }),
  //       TE.match(
  //         (e) => {
  //           loadingOverlay.hide()
  //           if (e._tag === 'RequestCancelledError') {
  //             Alert.alert(t('offer.requestWasCancelledByOtherSide'))
  //           } else if (e._tag === 'RequestNotFoundError') {
  //             Alert.alert(t('offer.requestNotFound'))
  //           } else if (e._tag === 'ReceiverInboxDoesNotExistError') {
  //             Alert.alert(t('offer.otherSideAccountDeleted'))
  //           } else {
  //             showErrorAlert({
  //               title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
  //               error: e,
  //             })
  //           }
  //         },
  //         () => {
  //           loadingOverlay.hide()
  //         }
  //       )
  //     )()
  //   }
  // }

  return (
    <XStack gap="$4">
      <Button
        onPress={() => {
          Effect.runFork(approveChat(false))
        }}
        fullSize
        variant="primary"
        text={t('common.decline')}
      />
      <Button
        onPress={() => {
          Effect.runFork(approveChat(true))
        }}
        variant="secondary"
        fullSize
        text={t('common.accept')}
      />
    </XStack>
  )
}

export default AcceptDeclineButtons
