import {Effect, HashMap, Option} from 'effect'
import {getDefaultStore} from 'jotai'
import {
  executeTasksWithDependencies,
  registerInAppLoadingTask,
  taskRegistryAtom,
} from './index'
import {
  getManagedTaskFiberCount,
  interruptAndAwaitAllInAppLoadingTasks,
  runForkManagedTask,
} from './managedTaskFibers'

let mockControlMode = 'normal'

jest.mock('../deviceMigration/controlStore', () => ({
  readMigrationControlRecord: () => ({mode: mockControlMode}),
}))

jest.mock('../reportError', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    __esModule: true,
    default: jest.fn(),
    reportErrorE: jest.fn(() => Effect.succeed(undefined)),
  }
})

jest.mock('../preferences', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    preferencesAtom: atom({runTasksInParallel: false}),
  }
})

jest.mock('../../state/ActionBenchmarks', () => ({
  startBenchmark: () => () => {},
}))

const getTaskStatusTag = (taskName: string): string => {
  const registry = getDefaultStore().get(taskRegistryAtom)
  const entry = HashMap.findFirst(registry, (task) => task.name === taskName)
  if (Option.isNone(entry)) throw new Error(`Task ${taskName} not registered`)
  return entry.value[1].status._tag
}

describe('in-app loading task migration gate', () => {
  beforeEach(() => {
    mockControlMode = 'normal'
  })

  it('skips whole waves while a migration is in progress and runs them in normal mode', async () => {
    let executions = 0
    const taskId = registerInAppLoadingTask({
      name: 'migrationGateWaveTask',
      task: () =>
        Effect.sync(() => {
          executions += 1
        }),
      requirements: {requiresUserLoggedIn: false, runOn: 'start'},
    })

    mockControlMode = 'sourceQuiescing'
    await Effect.runPromise(executeTasksWithDependencies([taskId]))
    expect(executions).toBe(0)
    expect(getTaskStatusTag('migrationGateWaveTask')).toBe('notStartedYet')

    mockControlMode = 'normal'
    await Effect.runPromise(executeTasksWithDependencies([taskId]))
    expect(executions).toBe(1)
    expect(getTaskStatusTag('migrationGateWaveTask')).toBe('completed')
  })

  it('stops an already-running wave from starting its next task after quiescence began', async () => {
    let secondTaskExecutions = 0

    const firstTaskId = registerInAppLoadingTask({
      name: 'migrationGateFlipsModeTask',
      task: () =>
        Effect.sync(() => {
          // Simulates quiescence starting while the wave is mid-flight.
          mockControlMode = 'sourceQuiescing'
        }),
      requirements: {requiresUserLoggedIn: false, runOn: 'start'},
    })
    const secondTaskId = registerInAppLoadingTask({
      name: 'migrationGateDependentTask',
      task: () =>
        Effect.sync(() => {
          secondTaskExecutions += 1
        }),
      requirements: {requiresUserLoggedIn: false, runOn: 'start'},
      dependsOn: [{id: firstTaskId}],
    })

    await Effect.runPromise(
      executeTasksWithDependencies([firstTaskId, secondTaskId])
    )

    expect(getTaskStatusTag('migrationGateFlipsModeTask')).toBe('completed')
    expect(secondTaskExecutions).toBe(0)
    expect(getTaskStatusTag('migrationGateDependentTask')).toBe('notStartedYet')
  })
})

describe('managed task fiber registry', () => {
  it('tracks forked fibers, interrupts and awaits them all, and auto-deregisters finished ones', async () => {
    const before = getManagedTaskFiberCount()

    runForkManagedTask(Effect.never)
    runForkManagedTask(Effect.never)
    expect(getManagedTaskFiberCount()).toBe(before + 2)

    await Effect.runPromise(interruptAndAwaitAllInAppLoadingTasks())
    expect(getManagedTaskFiberCount()).toBe(0)

    // Completed fibers deregister themselves.
    const finished = runForkManagedTask(Effect.void)
    await Effect.runPromise(Effect.asVoid(finished.await))
    // Observer fires asynchronously right after the fiber settles.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(getManagedTaskFiberCount()).toBe(0)
  })
})
