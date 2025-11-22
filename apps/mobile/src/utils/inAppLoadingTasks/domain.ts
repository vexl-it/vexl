import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type Effect, Schema} from 'effect'
import {type Store} from 'jotai/vanilla/store'

export class InAppLoadingTaskError extends Schema.TaggedError<InAppLoadingTaskError>(
  'InAppLoadingTaskError'
)('InAppLoadingTaskError', {
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

const TaskId = Schema.String.pipe(Schema.brand('InAppLoadingTaskId'))
export type InAppLoadingTaskId = typeof TaskId.Type
export const TaskIdSchema = TaskId

export type InAppLoadingTaskStatus =
  | {
      _tag: 'pending'
      startedAt: UnixMilliseconds
    }
  | {
      _tag: 'completed'
      startedAt: UnixMilliseconds
      finishedAt: UnixMilliseconds
    }
  | {
      _tag: 'failed'
      startedAt: UnixMilliseconds
      finishedAt: UnixMilliseconds
      error: InAppLoadingTaskError
    }
  | {
      _tag: 'notStartedYet'
    }

export interface InAppLoadingTasksRequirements {
  requiresUserLoggedIn: boolean
  runOn: 'resume' | 'start'
}

export interface InAppLoadingTask {
  name: string
  status: InAppLoadingTaskStatus
  task: (store: Store) => Effect.Effect<void, InAppLoadingTaskError>
  requirements: InAppLoadingTasksRequirements
  dependsOn?: Array<{id: InAppLoadingTaskId; onlyIfSucceeds?: boolean}>
}
