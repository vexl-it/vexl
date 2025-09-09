import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {XStack, type XStackProps} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Button from '../../Button'
import {chatMolecule} from '../atoms'

interface Props extends XStackProps {
  message: string
}

function AcceptDeclineButtons({message, ...props}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {approveChatRequestActionAtom} = useMolecule(chatMolecule)
  const approveChat = useSetAtom(approveChatRequestActionAtom)

  return (
    <XStack gap="$4" px="$4" mb="$2" {...props}>
      <Button
        onPress={() => {
          Effect.runFork(approveChat({approve: false, message}))
        }}
        fullSize
        variant="primary"
        text={t('common.decline')}
      />
      <Button
        onPress={() => {
          Effect.runFork(approveChat({approve: true, message}))
        }}
        variant="secondary"
        fullSize
        text={t('common.accept')}
      />
    </XStack>
  )
}

export default AcceptDeclineButtons
