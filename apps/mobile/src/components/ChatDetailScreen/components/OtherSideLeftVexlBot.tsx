import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React, {useCallback} from 'react'
import UserFeedback, {type UserFeedbackResult} from '../../UserFeedback'
import {chatMolecule} from '../atoms'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

export function OtherSideLeftVexlBot(): React.ReactElement | null {
  const {feedbackSubmittedAtom} = useMolecule(chatMolecule)
  const [feedbackSubmitted, setFeedbackSubmitted] = useAtom(
    feedbackSubmittedAtom
  )

  const handleSubmitFeedback = useCallback(
    (userFeedbackResult: UserFeedbackResult) => {
      if (userFeedbackResult.completed !== 'full') return
      setFeedbackSubmitted(true)
    },
    [setFeedbackSubmitted]
  )

  return (
    <>
      {!feedbackSubmitted && (
        <VexlbotActionCard>
          <UserFeedback
            onFinishClose={handleSubmitFeedback}
            feedbackType="CHAT_RATING"
          />
        </VexlbotActionCard>
      )}
    </>
  )
}
