import runWhenIdleWithTimeout from './runWhenIdleWithTimeout'

const idleDeadline: IdleDeadline = {
  didTimeout: false,
  timeRemaining: () => 50,
}

let idleCallback: IdleRequestCallback | undefined
let cancelledIdleCallbackHandles: number[] = []

function flushIdleCallback(): void {
  const callback = idleCallback
  if (callback !== undefined) callback(idleDeadline)
}

beforeEach(() => {
  jest.useFakeTimers()
  idleCallback = undefined
  cancelledIdleCallbackHandles = []

  jest
    .spyOn(globalThis, 'requestIdleCallback')
    .mockImplementation((callback) => {
      idleCallback = callback
      return 1
    })
  jest.spyOn(globalThis, 'cancelIdleCallback').mockImplementation((handle) => {
    cancelledIdleCallbackHandles.push(handle)
  })
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

it('runs once when the idle callback fires before the timeout', () => {
  const callback = jest.fn()

  runWhenIdleWithTimeout(callback, {timeout: 500})
  flushIdleCallback()
  jest.advanceTimersByTime(500)

  expect(callback).toHaveBeenCalledTimes(1)
  expect(cancelledIdleCallbackHandles).toEqual([])
})

it('runs once at the timeout and cancels the pending idle callback', () => {
  const callback = jest.fn()

  runWhenIdleWithTimeout(callback, {timeout: 500})
  jest.advanceTimersByTime(499)
  expect(callback).not.toHaveBeenCalled()

  jest.advanceTimersByTime(1)
  flushIdleCallback()

  expect(callback).toHaveBeenCalledTimes(1)
  expect(cancelledIdleCallbackHandles).toEqual([1])
})
