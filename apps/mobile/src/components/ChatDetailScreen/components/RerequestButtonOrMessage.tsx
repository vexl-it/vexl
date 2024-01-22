import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {YStack} from 'tamagui'
import getRerequestPossibleInDaysText from '../../../utils/getRerequestPossibleInDaysText'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import Button from '../../Button'
import InfoSquare from '../../InfoSquare'
import identityIconSvg from '../../images/identityIconSvg'
import {chatMolecule} from '../atoms'

function RerequestButtonOrMessage({
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

  const rerequestText = !rerequestInfo.canBeRerequested
    ? getRerequestPossibleInDaysText(rerequestInfo.possibleInDays, t)
    : null

  return (
    <YStack space="$2">
      {rerequestInfo.canBeRerequested ? (
        <Button
          disabled={rerequestButtonDisabled}
          onPress={onRerequestPressed}
          variant="secondary"
          beforeIcon={identityIconSvg}
          text={t('offer.rerequest')}
        />
      ) : rerequestText ? (
        <InfoSquare>{rerequestText}</InfoSquare>
      ) : null}
      {requestState === 'requested' && (
        <Button
          text={t('offer.cancelRequest')}
          variant="primary"
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

export default RerequestButtonOrMessage
