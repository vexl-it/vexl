import {Deferred, Effect, HashMap} from 'effect'
import {getDefaultStore} from 'jotai'
import {preferencesAtom} from '../preferences'
import {executeTasksWithDependencies, taskRegistryAtom} from './atoms'
import {type InAppLoadingTask, InAppLoadingTaskError} from './domain'
import {registerInAppLoadingTask} from './index'

jest.mock('../../state/ActionBenchmarks', () => ({
  startBenchmark: () => () => {},
}))
jest.mock('../preferences', () => ({
  preferencesAtom: jest.requireActual('jotai').atom({runTasksInParallel: true}),
}))
jest.mock('../reportError', () => ({
  reportErrorE: () => jest.requireActual('effect').Effect.void,
}))

const store = getDefaultStore()

beforeEach(() => {
  store.set(taskRegistryAtom, HashMap.empty())
  store.set(preferencesAtom, (old) => ({...old, runTasksInParallel: true}))
})

function registerTask(
  name: string,
  task: InAppLoadingTask['task'],
  options: Pick<InAppLoadingTask, 'dependsOn' | 'runAfterOtherTasks'> = {}
): ReturnType<typeof registerInAppLoadingTask> {
  return registerInAppLoadingTask({
    name,
    task,
    requirements: {requiresUserLoggedIn: true, runOn: 'resume'},
    ...options,
  })
}

it.each([true, false])(
  'finishes every ordinary dependency wave before starting a long sync (parallel: %s)',
  async (runTasksInParallel) => {
    store.set(preferencesAtom, (old) => ({...old, runTasksInParallel}))
    const events: string[] = []
    const syncStarted = Effect.runSync(Deferred.make<undefined>())
    const releaseSync = Effect.runSync(Deferred.make<undefined>())
    const sync = registerTask(
      'sync',
      () =>
        Effect.gen(function* () {
          events.push('sync')
          yield* Deferred.succeed(syncStarted, undefined)
          yield* Deferred.await(releaseSync)
        }),
      {runAfterOtherTasks: true}
    )
    const fetch = registerTask('fetch', () =>
      Effect.sync(() => {
        events.push('fetch')
      })
    )
    const refresh = registerTask(
      'refresh',
      () =>
        Effect.sync(() => {
          events.push('refresh')
        }),
      {dependsOn: [{id: fetch}]}
    )
    const cleanup = registerTask(
      'cleanup',
      () =>
        Effect.sync(() => {
          events.push('cleanup')
        }),
      {dependsOn: [{id: refresh, onlyIfSucceeds: true}]}
    )

    const running = Effect.runPromise(
      executeTasksWithDependencies([sync, cleanup, fetch, refresh])
    )
    try {
      await Effect.runPromise(Deferred.await(syncStarted))
      expect(events).toEqual(['fetch', 'refresh', 'cleanup', 'sync'])
    } finally {
      await Effect.runPromise(Deferred.succeed(releaseSync, undefined))
      await running
    }
  }
)

it('runs deferred sync after failures and transitively skipped tasks', async () => {
  const syncTask = jest.fn(() => Effect.void)
  const skippedTask = jest.fn(() => Effect.void)
  const failed = registerTask('failed', () =>
    Effect.fail(new InAppLoadingTaskError({message: 'Expected test failure'}))
  )
  const skipped = registerTask('skipped', skippedTask, {
    dependsOn: [{id: failed, onlyIfSucceeds: true}],
  })
  const alsoSkipped = registerTask('also-skipped', skippedTask, {
    dependsOn: [{id: skipped, onlyIfSucceeds: true}],
  })
  const sync = registerTask('sync', syncTask, {runAfterOtherTasks: true})

  await Effect.runPromise(
    executeTasksWithDependencies([sync, alsoSkipped, skipped, failed])
  )

  expect(skippedTask).not.toHaveBeenCalled()
  expect(syncTask).toHaveBeenCalledTimes(1)
})

it('preserves explicit success requirements on a deferred task', async () => {
  const syncTask = jest.fn(() => Effect.void)
  const failed = registerTask('failed', () =>
    Effect.fail(new InAppLoadingTaskError({message: 'Expected test failure'}))
  )
  const sync = registerTask('sync', syncTask, {
    runAfterOtherTasks: true,
    dependsOn: [{id: failed, onlyIfSucceeds: true}],
  })

  await Effect.runPromise(executeTasksWithDependencies([sync, failed]))

  expect(syncTask).not.toHaveBeenCalled()
})

it('waits only for selected tasks and does not make deferred tasks wait on each other', async () => {
  const unselectedTask = jest.fn(() => Effect.void)
  registerTask('unselected', unselectedTask)
  const syncTask = jest.fn(() => Effect.void)
  const sync = registerTask('sync', syncTask, {runAfterOtherTasks: true})
  const otherSync = registerTask('other-sync', syncTask, {
    runAfterOtherTasks: true,
  })

  await Effect.runPromise(executeTasksWithDependencies([sync, otherSync]))

  expect(unselectedTask).not.toHaveBeenCalled()
  expect(syncTask).toHaveBeenCalledTimes(2)
  expect(HashMap.unsafeGet(store.get(taskRegistryAtom), sync).status._tag).toBe(
    'completed'
  )
})
