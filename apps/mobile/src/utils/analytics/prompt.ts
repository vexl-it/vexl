import {
  promptJourney,
  type PromptId,
  type PromptOutcome,
} from '@vexl-next/analytics-definitions/src/definitions/prompt'
import {Array, Option} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import {analyticsActionAtom} from './analyticsActionAtom'
import {journeyReportActionAtom, openJourneyStates} from './report'

const promptJourneyAtom = journeyReportActionAtom(promptJourney)

/** A prompt shown again before its outcome continues the same journey. */
export const reportPromptShownActionAtom = analyticsActionAtom(
  (get, set, promptId: PromptId) => {
    const awaitsOutcome = Array.some(
      openJourneyStates(get, promptJourney, promptId),
      (state) => state.outcome === undefined
    )
    if (!awaitsOutcome)
      set(promptJourneyAtom, {promptId}, {key: promptId, alwaysStart: true})
  }
)

export const reportPromptOutcomeActionAtom = analyticsActionAtom(
  (get, set, promptId: PromptId, outcome: PromptOutcome) => {
    set(
      promptJourneyAtom,
      (current) =>
        Option.exists(current, (state) => state.outcome !== undefined)
          ? {}
          : {outcome},
      {key: promptId, onlyIfOpen: true}
    )
  }
)

export const reportPromptTargetReachedActionAtom = analyticsActionAtom(
  (get, set, promptId: PromptId) => {
    set(
      promptJourneyAtom,
      {targetReached: true},
      {key: promptId, onlyIfOpen: true}
    )
  }
)

export const reportContactsImportedActionAtom = analyticsActionAtom(
  (get, set) => {
    set(reportPromptTargetReachedActionAtom, 'importContacts')
    set(reportPromptTargetReachedActionAtom, 'importNewContacts')
  }
)

/** Reports the prompt as shown once visible, returns its outcome reporter. */
export function useReportPrompt(
  promptId: PromptId,
  isVisible: boolean
): (outcome: PromptOutcome) => void {
  const reportShown = useSetAtom(reportPromptShownActionAtom)
  const reportOutcome = useSetAtom(reportPromptOutcomeActionAtom)

  useEffect(() => {
    if (isVisible) reportShown(promptId)
  }, [isVisible, promptId, reportShown])

  return useCallback(
    (outcome) => {
      reportOutcome(promptId, outcome)
    },
    [promptId, reportOutcome]
  )
}
