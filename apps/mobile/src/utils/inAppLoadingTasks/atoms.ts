import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, HashMap, HashSet, Option, pipe} from 'effect'
import {atom, getDefaultStore} from 'jotai'
import {type Store} from 'jotai/vanilla/store'
import {startBenchmark} from '../../state/ActionBenchmarks'
import {preferencesAtom} from '../preferences'
import {reportErrorE} from '../reportError'
import {
  type InAppLoadingTask,
  type InAppLoadingTaskDependency,
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
    // Throttled tasks keep their previous 'completed' status (and its
    // finishedAt), so a skipped run still counts as succeeded for dependents.
    const minTimeBetweenRunsMs = task.requirements.minTimeBetweenRunsMs
    if (
      minTimeBetweenRunsMs !== undefined &&
      task.status._tag === 'completed' &&
      unixMillisecondsNow() - task.status.finishedAt < minTimeBetweenRunsMs
    ) {
      console.log(
        'InAppLoadingTasks',
        `⏭️ Skipping task ${task.name} — completed ${Math.round(
          (unixMillisecondsNow() - task.status.finishedAt) / 1000
        )}s ago (throttle: ${Math.round(minTimeBetweenRunsMs / 1000)}s)`
      )
      return
    }

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

    // Build dependency graph using HashMap, preserving onlyIfSucceeds so a
    // dependent can require its dependency to have completed *successfully*
    // (not merely to have run).
    const dependencyMap = pipe(
      Array.fromIterable(tasksToExecute),
      Array.map(([taskId, task]) => [taskId, task.dependsOn ?? []] as const),
      HashMap.fromIterable
    )

    const emptyDeps: readonly InAppLoadingTaskDependency[] = []
    const depsOf = (
      taskId: InAppLoadingTaskId
    ): readonly InAppLoadingTaskDependency[] =>
      Option.getOrElse(HashMap.get(dependencyMap, taskId), () => emptyDeps)

    // resolved: task finished executing OR was skipped (so plain dependents may
    // proceed). succeeded: task finished executing with a 'completed' status
    // (so onlyIfSucceeds dependents may proceed).
    let resolved = HashSet.empty<InAppLoadingTaskId>()
    let succeeded = HashSet.empty<InAppLoadingTaskId>()
    let pending = HashSet.fromIterable(taskIds)

    // Execute tasks in waves based on dependencies
    while (HashSet.size(pending) > 0) {
      const pendingArray = Array.fromIterable(pending)

      // A task can never satisfy its preconditions once one of its
      // onlyIfSucceeds dependencies has resolved without succeeding - skip it
      // (and transitively its own dependents) rather than run it against an
      // unmet precondition.
      const skipTasks = pipe(
        pendingArray,
        Array.filter((taskId) =>
          pipe(
            depsOf(taskId),
            Array.some(
              (dep) =>
                dep.onlyIfSucceeds === true &&
                HashSet.has(resolved, dep.id) &&
                !HashSet.has(succeeded, dep.id)
            )
          )
        )
      )
      const skipSet = HashSet.fromIterable(skipTasks)

      // Find tasks that can run now (all dependencies satisfied). A plain
      // dependency is satisfied once resolved; an onlyIfSucceeds dependency is
      // satisfied only once succeeded.
      const readyTasks = pipe(
        pendingArray,
        Array.filterMap((taskId) => {
          if (HashSet.has(skipSet, taskId)) return Option.none()

          const allDepsSatisfied = pipe(
            depsOf(taskId),
            Array.every((dep) =>
              dep.onlyIfSucceeds === true
                ? HashSet.has(succeeded, dep.id)
                : HashSet.has(resolved, dep.id)
            )
          )

          const taskOption = HashMap.get(tasksToExecute, taskId)
          return allDepsSatisfied && Option.isSome(taskOption)
            ? Option.some({id: taskId, task: taskOption.value})
            : Option.none()
        })
      )

      // If nothing can be skipped or run yet we have a circular/missing
      // dependency; bail out rather than loop forever.
      if (skipTasks.length === 0 && readyTasks.length === 0) {
        console.error(
          'InAppLoadingTasks',
          '❌ Circular dependency detected or missing dependencies:',
          pendingArray
        )
        break
      }

      // Mark skipped tasks resolved-but-not-succeeded and drop them.
      for (const taskId of skipTasks) {
        console.warn(
          'InAppLoadingTasks',
          `⏭️ Skipping task, a required dependency did not succeed: ${taskId}`
        )
        resolved = HashSet.add(resolved, taskId)
        pending = HashSet.remove(pending, taskId)
      }

      // Execute ready tasks
      const taskEffects = pipe(
        readyTasks,
        Array.map(({id, task}) => executeSingleTask(store, id, task))
      )

      yield* _(
        Effect.all(taskEffects, {concurrency: runInParallel ? 'unbounded' : 1})
      )

      // Record execution outcomes so dependents resolve correctly.
      const registryAfterWave = store.get(taskRegistryAtom)
      for (const {id} of readyTasks) {
        resolved = HashSet.add(resolved, id)
        pending = HashSet.remove(pending, id)
        const didSucceed = pipe(
          HashMap.get(registryAfterWave, id),
          Option.map((task) => task.status._tag === 'completed'),
          Option.getOrElse(() => false)
        )
        if (didSucceed) {
          succeeded = HashSet.add(succeeded, id)
        }
      }
    }
    console.log('InAppLoadingTasks', 'All tasks executed', {taskIds})
  })
