import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import Button from '../../Button'
import {chatMolecule} from '../atoms'

function RerequestOrCancelButton({
  onRerequestPressed,
  rerequestButtonDisabled,
}: {
  onRerequestPressed: () => void
  rerequestButtonDisabled: boolean
}): JSX.Element | null {
  const {canBeRerequestedAtom, cancelRequestActionAtom, requestStateAtom} =
    useMolecule(chatMolecule)
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()

  const rerequestInfo = useAtomValue(canBeRerequestedAtom)
  const requestState = useAtomValue(requestStateAtom)
  const cancelRequest = useSetAtom(cancelRequestActionAtom)

  return (
    <YStack space="$2" pt="$2">
      {!!rerequestInfo.canBeRerequested && (
        <Button
          disabled={rerequestButtonDisabled}
          onPress={onRerequestPressed}
          variant="secondary"
          text={t('offer.rerequest')}
        />
      )}
      {requestState === 'requested' && (
        <Button
          text={t('offer.cancelRequest')}
          variant="redDark"
          onPress={() => {
            void cancelRequest()?.then((success) => {
              if (success) safeGoBack()
            })
          }}
        />
      )}
    </YStack>
  )
}

export default RerequestOrCancelButton
