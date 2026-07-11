import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Schema} from 'effect'
import {LocalTransportConnectionId} from './schemas'
import {VexlLocalTransport} from './VexlLocalTransport'

const mockListeners = new Map<string, Set<(payload: unknown) => void>>()

const mockNativeModule = {
  startListener: jest.fn(async (): Promise<unknown> => ({port: 4242})),
  getLocalEndpointCandidates: jest.fn(
    async (): Promise<unknown> => [{host: '192.168.1.10', port: 4242}]
  ),
  stopListener: jest.fn(async (): Promise<unknown> => null),
  connect: jest.fn(
    async (): Promise<unknown> => ({connectionId: 'outbound-connection'})
  ),
  send: jest.fn(async (): Promise<unknown> => null),
  closeConnection: jest.fn(async (): Promise<unknown> => null),
  addListener: jest.fn(
    (eventName: string, listener: (payload: unknown) => void) => {
      let registered = mockListeners.get(eventName)
      if (registered === undefined) {
        registered = new Set()
        mockListeners.set(eventName, registered)
      }
      registered.add(listener)
      return {
        remove: () => {
          mockListeners.get(eventName)?.delete(listener)
        },
      }
    }
  ),
}

function emitNativeEvent(eventName: string, payload: unknown): void {
  for (const listener of mockListeners.get(eventName) ?? []) {
    listener(payload)
  }
}

jest.mock('expo-modules-core', () => {
  const actual = jest.requireActual('expo-modules-core')
  return {
    ...actual,
    requireNativeModule: jest.fn((moduleName: string) =>
      moduleName === 'VexlLocalTransport'
        ? mockNativeModule
        : actual.requireNativeModule(moduleName)
    ),
  }
})

const connectionId = (value: string): LocalTransportConnectionId =>
  Schema.decodeSync(LocalTransportConnectionId)(value)

describe('VexlLocalTransport wrapper', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockListeners.clear()
    // startListener resets the single-inbound-connection state kept in the
    // wrapper module between tests.
    await VexlLocalTransport.startListener()
  })

  describe('bridge result decoding', () => {
    it('decodes a valid startListener result', async () => {
      mockNativeModule.startListener.mockResolvedValueOnce({port: 5555})
      await expect(VexlLocalTransport.startListener()).resolves.toEqual({
        port: 5555,
      })
    })

    it('rejects with an enumerated DeviceMigrationError when the startListener result is malformed', async () => {
      mockNativeModule.startListener.mockResolvedValueOnce({port: 'nope'})
      const failure = await VexlLocalTransport.startListener().then(
        () => undefined,
        (error: unknown) => error
      )
      expect(failure).toBeInstanceOf(DeviceMigrationError)
      expect(failure).toHaveProperty('code', 'transportFailed')
    })

    it('rejects when the startListener result port is out of range', async () => {
      mockNativeModule.startListener.mockResolvedValueOnce({port: 0})
      await expect(VexlLocalTransport.startListener()).rejects.toHaveProperty(
        'code',
        'transportFailed'
      )
    })

    it('decodes endpoint candidates', async () => {
      mockNativeModule.getLocalEndpointCandidates.mockResolvedValueOnce([
        {host: '192.168.1.10', port: 4242},
        {host: '10.0.0.3', port: 4242},
      ])
      await expect(
        VexlLocalTransport.getLocalEndpointCandidates()
      ).resolves.toEqual([
        {host: '192.168.1.10', port: 4242},
        {host: '10.0.0.3', port: 4242},
      ])
    })

    it('rejects malformed endpoint candidates', async () => {
      mockNativeModule.getLocalEndpointCandidates.mockResolvedValueOnce([
        {host: '', port: 4242},
      ])
      await expect(
        VexlLocalTransport.getLocalEndpointCandidates()
      ).rejects.toHaveProperty('code', 'transportFailed')
    })

    it('decodes a connect result and passes arguments through', async () => {
      const result = await VexlLocalTransport.connect('192.168.1.20', 4242, 500)
      expect(result).toEqual({connectionId: 'outbound-connection'})
      expect(mockNativeModule.connect).toHaveBeenCalledWith(
        '192.168.1.20',
        4242,
        500
      )
    })

    it('rejects a malformed connect result', async () => {
      mockNativeModule.connect.mockResolvedValueOnce({connectionId: ''})
      await expect(
        VexlLocalTransport.connect('192.168.1.20', 4242, 500)
      ).rejects.toHaveProperty('code', 'transportFailed')
    })

    it('passes send and closeConnection arguments through', async () => {
      await VexlLocalTransport.send(connectionId('conn-1'), 'aGVsbG8=')
      expect(mockNativeModule.send).toHaveBeenCalledWith('conn-1', 'aGVsbG8=')

      await VexlLocalTransport.closeConnection(connectionId('conn-1'))
      expect(mockNativeModule.closeConnection).toHaveBeenCalledWith('conn-1')
    })
  })

  describe('event payload decoding', () => {
    it('delivers a decoded data event', () => {
      const onData = jest.fn()
      VexlLocalTransport.addDataListener(onData)

      emitNativeEvent('onData', {connectionId: 'conn-1', dataBase64: 'aGk='})

      expect(onData).toHaveBeenCalledTimes(1)
      expect(onData).toHaveBeenCalledWith({
        connectionId: 'conn-1',
        dataBase64: 'aGk=',
      })
    })

    it('drops a malformed data event and reports an enumerated error', () => {
      const onData = jest.fn()
      const onInvalidEvent = jest.fn()
      VexlLocalTransport.addDataListener(onData, onInvalidEvent)

      emitNativeEvent('onData', {connectionId: 42, dataBase64: 'aGk='})
      emitNativeEvent('onData', 'not-an-object')
      emitNativeEvent('onData', {connectionId: '', dataBase64: 'aGk='})

      expect(onData).not.toHaveBeenCalled()
      expect(onInvalidEvent).toHaveBeenCalledTimes(3)
      for (const [error] of onInvalidEvent.mock.calls) {
        expect(error).toBeInstanceOf(DeviceMigrationError)
        expect(error).toHaveProperty('code', 'transportFailed')
      }
    })

    it('drops a connection closed event with an unknown reason', () => {
      const onClosed = jest.fn()
      const onInvalidEvent = jest.fn()
      VexlLocalTransport.addConnectionClosedListener(onClosed, onInvalidEvent)

      emitNativeEvent('onConnectionClosed', {
        connectionId: 'conn-1',
        reason: 'meteorStrike',
      })

      expect(onClosed).not.toHaveBeenCalled()
      expect(onInvalidEvent).toHaveBeenCalledTimes(1)
    })

    it('decodes listener failed events', () => {
      const onListenerFailed = jest.fn()
      VexlLocalTransport.addListenerFailedListener(onListenerFailed)

      emitNativeEvent('onListenerFailed', {reason: 'error'})

      expect(onListenerFailed).toHaveBeenCalledWith({reason: 'error'})
    })
  })

  describe('single inbound connection enforcement', () => {
    it('delivers the first accepted connection and refuses any further one', () => {
      const onAccepted = jest.fn()
      VexlLocalTransport.addConnectionAcceptedListener(onAccepted)

      emitNativeEvent('onConnectionAccepted', {
        connectionId: 'inbound-1',
        remoteHost: '192.168.1.30',
      })
      emitNativeEvent('onConnectionAccepted', {
        connectionId: 'inbound-2',
        remoteHost: '192.168.1.31',
      })

      expect(onAccepted).toHaveBeenCalledTimes(1)
      expect(onAccepted).toHaveBeenCalledWith({
        connectionId: 'inbound-1',
        remoteHost: '192.168.1.30',
      })
      expect(mockNativeModule.closeConnection).toHaveBeenCalledWith('inbound-2')
    })

    it('suppresses data and closed events of a refused connection', () => {
      const onAccepted = jest.fn()
      const onData = jest.fn()
      const onClosed = jest.fn()
      VexlLocalTransport.addConnectionAcceptedListener(onAccepted)
      VexlLocalTransport.addDataListener(onData)
      VexlLocalTransport.addConnectionClosedListener(onClosed)

      emitNativeEvent('onConnectionAccepted', {
        connectionId: 'inbound-1',
        remoteHost: '192.168.1.30',
      })
      emitNativeEvent('onConnectionAccepted', {
        connectionId: 'inbound-2',
        remoteHost: '192.168.1.31',
      })
      emitNativeEvent('onData', {connectionId: 'inbound-2', dataBase64: 'evil'})
      emitNativeEvent('onConnectionClosed', {
        connectionId: 'inbound-2',
        reason: 'cancelled',
      })
      emitNativeEvent('onData', {connectionId: 'inbound-1', dataBase64: 'aGk='})

      expect(onData).toHaveBeenCalledTimes(1)
      expect(onData).toHaveBeenCalledWith({
        connectionId: 'inbound-1',
        dataBase64: 'aGk=',
      })
      expect(onClosed).not.toHaveBeenCalled()
    })

    it('allows a new inbound connection after the listener is restarted', async () => {
      const onAccepted = jest.fn()
      VexlLocalTransport.addConnectionAcceptedListener(onAccepted)

      emitNativeEvent('onConnectionAccepted', {
        connectionId: 'inbound-1',
        remoteHost: '192.168.1.30',
      })
      await VexlLocalTransport.startListener()
      emitNativeEvent('onConnectionAccepted', {
        connectionId: 'inbound-3',
        remoteHost: '192.168.1.32',
      })

      expect(onAccepted).toHaveBeenCalledTimes(2)
      expect(onAccepted).toHaveBeenLastCalledWith({
        connectionId: 'inbound-3',
        remoteHost: '192.168.1.32',
      })
    })
  })

  describe('unsubscribe semantics', () => {
    it('stops delivering events after unsubscribe', () => {
      const onData = jest.fn()
      const unsubscribe = VexlLocalTransport.addDataListener(onData)

      emitNativeEvent('onData', {connectionId: 'conn-1', dataBase64: 'aGk='})
      unsubscribe()
      emitNativeEvent('onData', {connectionId: 'conn-1', dataBase64: 'aGk='})

      expect(onData).toHaveBeenCalledTimes(1)
    })

    it('only removes the unsubscribed listener', () => {
      const first = jest.fn()
      const second = jest.fn()
      const unsubscribeFirst = VexlLocalTransport.addDataListener(first)
      VexlLocalTransport.addDataListener(second)

      unsubscribeFirst()
      emitNativeEvent('onData', {connectionId: 'conn-1', dataBase64: 'aGk='})

      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })
  })
})
