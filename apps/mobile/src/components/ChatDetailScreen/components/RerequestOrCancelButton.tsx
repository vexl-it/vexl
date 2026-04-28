import {useNavigation} from '@react-navigation/native'
import {Button, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {chatMolecule} from '../atoms'

function RerequestOrCancelButton(
  props: React.ComponentProps<typeof XStack>
): React.ReactElement | null {
  const {
    canBeRerequestedAtom,
    cancelRequestActionAtom,
    offerForChatAtom,
    requestStateAtom,
    showOfferDeletedWithOptionToDeleteActionAtom,
  } = useMolecule(chatMolecule)
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()

  const offer = useAtomValue(offerForChatAtom)
  const rerequestInfo = useAtomValue(canBeRerequestedAtom)
  const requestState = useAtomValue(requestStateAtom)
  const cancelRequest = useSetAtom(cancelRequestActionAtom)
  const showOfferDeletedWithOptionToDelete = useSetAtom(
    showOfferDeletedWithOptionToDeleteActionAtom
  )

  return (
    <XStack gap="$3" width="100%" {...props}>
      {requestState === 'requested' && (
        <Button
          f={1}
          size="large"
          variant="destructive"
          onPress={() => {
            Effect.runFork(
              cancelRequest().pipe(
                Effect.tap((success) =>
                  Effect.sync(() => {
                    if (success) safeGoBack()
                  })
                ),
                Effect.asVoid
              )
            )
          }}
        >
          {t('offer.cancelRequest')}
        </Button>
      )}
      {!!rerequestInfo.canBeRerequested && (
        <Button
          f={1}
          size="large"
          onPress={() => {
            if (!offer) {
              showOfferDeletedWithOptionToDelete()
              return
            }

            navigation.navigate('SendMessage', {
              offerId: offer.offerInfo.offerId,
              mode: 'rerequest',
            })
          }}
          variant="primary"
        >
          {t('common.sendAMessage')}
        </Button>
      )}
    </XStack>
  )
}

export default RerequestOrCancelButton
