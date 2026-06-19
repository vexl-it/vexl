import {type Feedback} from '@vexl-next/domain/src/general/feedback'
import {Array} from 'effect'

export interface UserFeedbackResult {
  completed: 'full' | 'partial' | 'dismissed'
}

export function resultFromFeedback(feedback: Feedback): UserFeedbackResult {
  if (feedback.finished) return {completed: 'full'}

  if (
    feedback.stars !== 0 ||
    Array.isNonEmptyReadonlyArray(feedback.objections) ||
    feedback.textComment.trim() !== ''
  ) {
    return {completed: 'partial'}
  }

  return {completed: 'dismissed'}
}
