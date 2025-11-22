import {HashMap, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {taskRegistryAtom} from './atoms'
import {
  type InAppLoadingTask,
  type InAppLoadingTaskId,
  TaskIdSchema,
} from './domain'

// Re-export domain types and schemas
export * from './domain'

// Re-export atoms and functions
export * from './atoms'

export const registerInAppLoadingTask = (
  task: Omit<InAppLoadingTask, 'status'>
): InAppLoadingTaskId => {
  const taskId = Schema.decodeSync(TaskIdSchema)(task.name)
  const store = getDefaultStore()

  if (HashMap.has(store.get(taskRegistryAtom), taskId)) {
    throw new Error(
      `Task with id "${taskId}" is already registered. This should not happen since tasks should always be added on module load.`
    )
  }

  // Create task with initial status
  const taskWithStatus: InAppLoadingTask = {
    ...task,
    status: {_tag: 'notStartedYet'},
  }

  store.set(taskRegistryAtom, HashMap.set(taskId, taskWithStatus))

  return taskId
}
