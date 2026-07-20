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

/** Default throttle for expensive resume tasks — see minTimeBetweenRunsMs. */
export const FIVE_MINUTES_MS = 5 * 60 * 1000

export interface InAppLoadingTasksRequirements {
  requiresUserLoggedIn: boolean
  runOn: 'resume' | 'start'
  /**
   * Skip the run when the task last completed successfully less than this many
   * milliseconds ago. Use for expensive resume tasks (full server re-syncs,
   * device-contact reloads) that would otherwise re-run on every foregrounding.
   * A skipped run counts as succeeded for dependents. Cold starts always run —
   * the registry (and with it the last-completion time) lives in memory only.
   */
  minTimeBetweenRunsMs?: number
}

export interface InAppLoadingTaskDependency {
  id: InAppLoadingTaskId
  // When true the dependent runs only if this dependency completed
  // successfully. If the dependency failed (or was itself skipped) the
  // dependent is skipped instead of run. Use it when running the dependent
  // against a failed prerequisite would be unsafe (e.g. deleting data based on
  // state a failed fetch never refreshed).
  onlyIfSucceeds?: boolean
}

export interface InAppLoadingTask {
  name: string
  status: InAppLoadingTaskStatus
  task: (store: Store) => Effect.Effect<void, InAppLoadingTaskError>
  requirements: InAppLoadingTasksRequirements
  dependsOn?: InAppLoadingTaskDependency[]
}
