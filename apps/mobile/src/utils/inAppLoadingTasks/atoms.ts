import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, HashMap, HashSet, Option, pipe} from 'effect'
import {atom, getDefaultStore} from 'jotai'
import {type Store} from 'jotai/vanilla/store'
import {startBenchmark} from '../../state/ActionBenchmarks'
import {preferencesAtom} from '../preferences'
import {reportErrorE} from '../reportError'
import {
  type InAppLoadingTask,
  type InAppLoadingTaskId,
  type InAppLoadingTaskStatus,
  InAppLoadingTaskError,
} from './domain'

// Task registry atom using Effect HashMap
export const taskRegistryAtom = atom<
  HashMap.HashMap<InAppLoadingTaskId, InAppLoadingTask>
>(HashMap.empty())

// Derived atom for active loading tasks
export const activeLoadingTasksAtom = atom((get) => {
  const registry = get(taskRegistryAtom)

  const activeTasks = pipe(
    Array.fromIterable(registry),
    Array.filterMap(([id, task]) =>
      task.status._tag === 'pending'
        ? Option.some({id, name: task.name})
        : Option.none()
    )
  )

  return {
    count: activeTasks.length,
    taskNames: pipe(
      activeTasks,
      Array.map((t) => t.name)
    ),
    tasks: activeTasks,
  }
})

// Helper to update task status in registry
const updateTaskStatus = (
  store: Store,
  taskId: InAppLoadingTaskId,
  status: InAppLoadingTaskStatus
): void => {
  store.set(taskRegistryAtom, (current) => {
    const updatedEntry = pipe(
      HashMap.get(current, taskId),
      Option.map((task) => ({...task, status}))
    )
    if (Option.isNone(updatedEntry)) {
      return current
    }
    return HashMap.set(current, taskId, updatedEntry.value)
  })
}

// Execute a single task with benchmarking and status updates
const executeSingleTask = (
  store: Store,
  taskId: InAppLoadingTaskId,
  task: InAppLoadingTask
): Effect.Effect<void, never> =>
  Effect.gen(function* (_) {
    const endBenchmark = startBenchmark(`InAppLoadingTask: ${task.name}`)
    const startedAt = unixMillisecondsNow()

    console.log('InAppLoadingTasks', `🚀 Starting task: ${task.name}`)

    // Update status to pending
    updateTaskStatus(store, taskId, {
      _tag: 'pending',
      startedAt,
    })

    // Run the task and catch all errors
    const result = yield* _(
      task.task(store),
      Effect.catchAllDefect((d) =>
        Effect.zipRight(
          reportErrorE(
            'error',
            new Error(`Defect in InAppLoadingTask ${task.name}`, {cause: d})
          ),
          Effect.fail(
            new InAppLoadingTaskError({
              message: 'Defect occurred during task execution',
              cause: d,
            })
          )
        )
      ),
      Effect.either
    )

    console.log('InAppLoadingTasks', taskId, {result})

    const finishedAt = unixMillisecondsNow()

    if (result._tag === 'Right') {
      // Update status to completed
      updateTaskStatus(store, taskId, {
        _tag: 'completed',
        startedAt,
        finishedAt,
      })

      endBenchmark('Success')
      console.log('InAppLoadingTasks', `✅ Completed task: ${task.name}`)
    } else {
      const taskError = result.left

      updateTaskStatus(store, taskId, {
        _tag: 'failed',
        startedAt,
        finishedAt,
        error: taskError,
      })

      endBenchmark(`Failed: ${taskError.message ?? 'Unknown error'}`)
      console.error(
        'InAppLoadingTasks',
        `❌ Failed task: ${task.name}`,
        result.left
      )
    }
  })

// Build dependency graph and execute tasks in correct order
export const executeTasksWithDependencies = (
  taskIds: InAppLoadingTaskId[]
): Effect.Effect<void> =>
  Effect.gen(function* (_) {
    console.log(
      'InAppLoadingTasks',
      'Executing tasks with dependencies:',
      taskIds
    )

    const store = getDefaultStore()
    const registry = store.get(taskRegistryAtom)
    const runInParallel = store.get(preferencesAtom).runTasksInParallel ?? true

    // Build a map of tasks to execute using HashMap
    const tasksToExecute = pipe(
      taskIds,
      Array.filterMap((taskId) => {
        const taskOption = HashMap.get(registry, taskId)
        return Option.isSome(taskOption)
          ? Option.some([taskId, taskOption.value] as const)
          : Option.none()
      }),
      HashMap.fromIterable
    )

    // Build dependency graph using HashMap
    const dependencyMap = pipe(
      Array.fromIterable(tasksToExecute),
      Array.map(([taskId, task]) => {
        const deps = pipe(
          task.dependsOn ?? [],
          Array.map((d) => d.id)
        )
        return [taskId, deps] as const
      }),
      HashMap.fromIterable
    )

    // Track completed and pending tasks using HashSet
    let completed = HashSet.empty<InAppLoadingTaskId>()
    let pending = HashSet.fromIterable(taskIds)

    // Execute tasks in waves based on dependencies
    while (HashSet.size(pending) > 0) {
      // Find tasks that can run now (all dependencies completed or no dependencies)
      const readyTasks = pipe(
        Array.fromIterable(pending),
        Array.filterMap((taskId) => {
          const taskOption = HashMap.get(tasksToExecute, taskId)
          const depsOption = HashMap.get(dependencyMap, taskId)
          const deps = Option.getOrElse(
            depsOption,
            () => [] as InAppLoadingTaskId[]
          )

          // Check if all dependencies are completed
          const allDepsCompleted = pipe(
            deps,
            Array.every((depId) => HashSet.has(completed, depId))
          )

          return allDepsCompleted && Option.isSome(taskOption)
            ? Option.some({id: taskId, task: taskOption.value})
            : Option.none()
        })
      )

      // If no tasks are ready but we still have pending tasks, we have a circular dependency
      if (readyTasks.length === 0 && HashSet.size(pending) > 0) {
        console.error(
          'InAppLoadingTasks',
          '❌ Circular dependency detected or missing dependencies:',
          Array.fromIterable(pending)
        )
        break
      }

      // Execute ready tasks
      const taskEffects = pipe(
        readyTasks,
        Array.map(({id, task}) => executeSingleTask(store, id, task))
      )

      yield* _(
        Effect.all(taskEffects, {concurrency: runInParallel ? 'unbounded' : 1})
      )

      // Mark tasks as completed and remove from pending
      for (const {id} of readyTasks) {
        completed = HashSet.add(completed, id)
        pending = HashSet.remove(pending, id)
      }
    }
    console.log('InAppLoadingTasks', 'All tasks executed', {taskIds})
  })
