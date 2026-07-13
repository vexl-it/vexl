import ExpoModulesCore
import Foundation
import Network

// Read loop chunk size. Must stay in sync with the data chunk plaintext limit
// declared in packages/domain/src/general/deviceMigration/limits.ts.
private let maxReceiveChunkBytes = 64 * 1024

internal final class ListenerAlreadyActiveException: Exception {
  override var reason: String {
    "A local transport listener is already active"
  }
}

internal final class ListenerStartFailedException: Exception {
  override var reason: String {
    "The local transport listener could not be started"
  }
}

internal final class NoActiveListenerException: Exception {
  override var reason: String {
    "No local transport listener is active"
  }
}

internal final class InvalidPortException: Exception {
  override var reason: String {
    "Port must be an integer between 1 and 65535"
  }
}

internal final class ConnectFailedException: Exception {
  override var reason: String {
    "The local transport connection could not be established"
  }
}

internal final class ConnectTimedOutException: Exception {
  override var reason: String {
    "The local transport connection attempt timed out or was cancelled"
  }
}

internal final class ConnectionNotFoundException: Exception {
  override var reason: String {
    "No open local transport connection with the given id exists"
  }
}

internal final class InvalidBase64PayloadException: Exception {
  override var reason: String {
    "The payload is not valid base64"
  }
}

internal final class SendFailedException: Exception {
  override var reason: String {
    "Sending on the local transport connection failed"
  }
}

/**
 * Minimal local-network TCP transport used exclusively by device migration.
 *
 * Deliberately thin: framing, limits, timeouts and the protocol state machine
 * live in the javascript protocol layer. There is no TLS at this layer — the
 * application-layer secretstream encrypts every byte. No mDNS/Bonjour is used;
 * the pairing QR carries the reachable endpoints.
 *
 * Privacy: nothing handled here (payloads, hosts, ports) may ever be logged
 * or reported. Errors crossing the bridge carry only the static messages of
 * the typed exceptions above.
 */
public class VexlLocalTransportModule: Module {
  // All mutable state is confined to this serial queue. The listener and all
  // connections are started on it, so their handlers also run on it.
  private let transportQueue = DispatchQueue(label: "it.vexl.local-transport")

  private var listener: NWListener?
  private var hasAcceptedInboundConnection = false
  private var connections: [String: NWConnection] = [:]
  // Connections javascript knows about (accepted event sent or connect
  // resolved). Only these produce onConnectionClosed events.
  private var announcedConnectionIds: Set<String> = []

  public func definition() -> ModuleDefinition {
    Name("VexlLocalTransport")

    Events("onConnectionAccepted", "onData", "onConnectionClosed", "onListenerFailed")

    AsyncFunction("startListener") { (promise: Promise) in
      self.transportQueue.async {
        self.startListenerOnQueue(promise: promise)
      }
    }

    AsyncFunction("getLocalEndpointCandidates") { (promise: Promise) in
      self.transportQueue.async {
        self.getLocalEndpointCandidatesOnQueue(promise: promise)
      }
    }

    AsyncFunction("stopListener") { (promise: Promise) in
      self.transportQueue.async {
        self.stopListenerOnQueue()
        promise.resolve(nil)
      }
    }

    AsyncFunction("connect") { (host: String, port: Int, timeoutMs: Int, promise: Promise) in
      self.transportQueue.async {
        self.connectOnQueue(host: host, port: port, timeoutMs: timeoutMs, promise: promise)
      }
    }

    AsyncFunction("send") { (connectionId: String, dataBase64: String, promise: Promise) in
      self.transportQueue.async {
        self.sendOnQueue(connectionId: connectionId, dataBase64: dataBase64, promise: promise)
      }
    }

    AsyncFunction("closeConnection") { (connectionId: String, promise: Promise) in
      self.transportQueue.async {
        self.notifyClosedOnQueue(connectionId: connectionId, reason: "cancelled")
        promise.resolve(nil)
      }
    }

    OnDestroy {
      self.transportQueue.async {
        self.teardownOnQueue()
      }
    }
  }

  // MARK: - Listener

  private func startListenerOnQueue(promise: Promise) {
    guard listener == nil else {
      promise.reject(ListenerAlreadyActiveException())
      return
    }

    let newListener: NWListener
    do {
      // No port requested — the system assigns an ephemeral port bound on all
      // interfaces.
      newListener = try NWListener(using: makeTcpParameters())
    } catch {
      promise.reject(ListenerStartFailedException())
      return
    }

    listener = newListener
    hasAcceptedInboundConnection = false
    var promiseSettled = false

    newListener.stateUpdateHandler = { [weak self] state in
      guard let self else {
        return
      }
      switch state {
      case .ready:
        if !promiseSettled {
          promiseSettled = true
          if let port = newListener.port?.rawValue {
            promise.resolve(["port": Int(port)])
          } else {
            self.cleanupListenerOnQueue(newListener)
            promise.reject(ListenerStartFailedException())
          }
        }
      case .failed:
        self.cleanupListenerOnQueue(newListener)
        if !promiseSettled {
          promiseSettled = true
          promise.reject(ListenerStartFailedException())
        } else {
          self.sendEvent("onListenerFailed", ["reason": "error"])
        }
      case .cancelled:
        if !promiseSettled {
          promiseSettled = true
          promise.reject(ListenerStartFailedException())
        }
      default:
        break
      }
    }

    newListener.newConnectionHandler = { [weak self] connection in
      self?.handleInboundConnectionOnQueue(connection)
    }

    newListener.start(queue: transportQueue)
  }

  private func cleanupListenerOnQueue(_ staleListener: NWListener) {
    staleListener.cancel()
    if listener === staleListener {
      listener = nil
    }
  }

  private func stopListenerOnQueue(clearHandlers: Bool = false) {
    if let activeListener = listener {
      listener = nil
      if clearHandlers {
        // Only during module destruction — javascript is gone. Otherwise the
        // state handler must stay attached so a startListener promise that is
        // still pending settles when the cancellation lands.
        activeListener.stateUpdateHandler = nil
      }
      activeListener.newConnectionHandler = nil
      activeListener.cancel()
    }
  }

  private func handleInboundConnectionOnQueue(_ connection: NWConnection) {
    if hasAcceptedInboundConnection {
      // At most one inbound peer is ever accepted per listener session.
      // Later connection attempts are refused outright and never surfaced
      // to javascript. The typescript wrapper enforces this too.
      connection.cancel()
      return
    }
    hasAcceptedInboundConnection = true

    let connectionId = UUID().uuidString
    connections[connectionId] = connection
    var becameReady = false

    connection.stateUpdateHandler = { [weak self] state in
      guard let self else {
        return
      }
      switch state {
      case .ready:
        becameReady = true
        self.announcedConnectionIds.insert(connectionId)
        self.sendEvent("onConnectionAccepted", [
          "connectionId": connectionId,
          "remoteHost": Self.remoteHostDescription(of: connection),
        ])
        self.startReceiveLoopOnQueue(connectionId: connectionId, connection: connection)
      case .failed:
        if !becameReady {
          // The only inbound slot was never actually established — allow a
          // later attempt from the peer instead of bricking the pairing.
          self.hasAcceptedInboundConnection = false
        }
        self.notifyClosedOnQueue(connectionId: connectionId, reason: "error")
      case .cancelled:
        self.notifyClosedOnQueue(connectionId: connectionId, reason: "cancelled")
      default:
        break
      }
    }

    connection.start(queue: transportQueue)
  }

  private func getLocalEndpointCandidatesOnQueue(promise: Promise) {
    guard let activeListener = listener, let port = activeListener.port?.rawValue else {
      promise.reject(NoActiveListenerException())
      return
    }
    let candidates: [[String: Any]] = Self.nonLoopbackIpv4Addresses().map { address in
      ["host": address, "port": Int(port)]
    }
    promise.resolve(candidates)
  }

  // MARK: - Connections

  private func connectOnQueue(host: String, port: Int, timeoutMs: Int, promise: Promise) {
    guard port >= 1, port <= 65535 else {
      promise.reject(InvalidPortException())
      return
    }
    guard !host.isEmpty, let nwPort = NWEndpoint.Port(rawValue: UInt16(port)) else {
      promise.reject(ConnectFailedException())
      return
    }

    let connection = NWConnection(
      host: NWEndpoint.Host(host),
      port: nwPort,
      using: makeTcpParameters()
    )
    let connectionId = UUID().uuidString
    var promiseSettled = false

    connection.stateUpdateHandler = { [weak self] state in
      guard let self else {
        return
      }
      switch state {
      case .ready:
        if !promiseSettled {
          promiseSettled = true
          self.connections[connectionId] = connection
          self.announcedConnectionIds.insert(connectionId)
          self.startReceiveLoopOnQueue(connectionId: connectionId, connection: connection)
          promise.resolve(["connectionId": connectionId])
        }
      case .failed:
        if !promiseSettled {
          promiseSettled = true
          connection.cancel()
          promise.reject(ConnectFailedException())
        } else {
          self.notifyClosedOnQueue(connectionId: connectionId, reason: "error")
        }
      case .cancelled:
        if !promiseSettled {
          promiseSettled = true
          promise.reject(ConnectTimedOutException())
        } else {
          self.notifyClosedOnQueue(connectionId: connectionId, reason: "cancelled")
        }
      default:
        break
      }
    }

    transportQueue.asyncAfter(deadline: .now() + .milliseconds(max(timeoutMs, 0))) {
      if !promiseSettled {
        // Cancelling moves the connection to .cancelled, which rejects the
        // promise with a timeout above.
        connection.cancel()
      }
    }

    connection.start(queue: transportQueue)
  }

  private func sendOnQueue(connectionId: String, dataBase64: String, promise: Promise) {
    guard let connection = connections[connectionId] else {
      promise.reject(ConnectionNotFoundException())
      return
    }
    guard let data = Data(base64Encoded: dataBase64) else {
      promise.reject(InvalidBase64PayloadException())
      return
    }
    // .contentProcessed provides backpressure — the promise resolves only
    // after the stack has taken ownership of the bytes.
    connection.send(content: data, completion: .contentProcessed { error in
      if error != nil {
        promise.reject(SendFailedException())
      } else {
        promise.resolve(nil)
      }
    })
  }

  private func startReceiveLoopOnQueue(connectionId: String, connection: NWConnection) {
    connection.receive(
      minimumIncompleteLength: 1,
      maximumLength: maxReceiveChunkBytes
    ) { [weak self] data, _, isComplete, error in
      guard let self else {
        return
      }
      // Runs on transportQueue because the connection was started on it.
      guard self.connections[connectionId] === connection else {
        // The connection was closed locally while a receive was in flight.
        return
      }
      if let data, !data.isEmpty {
        self.sendEvent("onData", [
          "connectionId": connectionId,
          "dataBase64": data.base64EncodedString(),
        ])
      }
      if error != nil {
        self.notifyClosedOnQueue(connectionId: connectionId, reason: "error")
        return
      }
      if isComplete {
        self.notifyClosedOnQueue(connectionId: connectionId, reason: "closedByPeer")
        return
      }
      self.startReceiveLoopOnQueue(connectionId: connectionId, connection: connection)
    }
  }

  private func notifyClosedOnQueue(connectionId: String, reason: String) {
    guard let connection = connections.removeValue(forKey: connectionId) else {
      return
    }
    connection.cancel()
    if announcedConnectionIds.remove(connectionId) != nil {
      sendEvent("onConnectionClosed", [
        "connectionId": connectionId,
        "reason": reason,
      ])
    }
  }

  private func teardownOnQueue() {
    stopListenerOnQueue(clearHandlers: true)
    let openConnections = connections
    connections.removeAll()
    announcedConnectionIds.removeAll()
    for (_, connection) in openConnections {
      connection.stateUpdateHandler = nil
      connection.cancel()
    }
  }

  // MARK: - Helpers

  private func makeTcpParameters() -> NWParameters {
    let tcpOptions = NWProtocolTCP.Options()
    tcpOptions.noDelay = true
    // No TLS at this layer — the application-layer secretstream encrypts.
    return NWParameters(tls: nil, tcp: tcpOptions)
  }

  private static func remoteHostDescription(of connection: NWConnection) -> String {
    guard case .hostPort(let host, _) = connection.endpoint else {
      return ""
    }
    switch host {
    case .ipv4(let address):
      return "\(address)"
    case .ipv6(let address):
      return "\(address)"
    case .name(let name, _):
      return name
    @unknown default:
      return ""
    }
  }

  private static func nonLoopbackIpv4Addresses() -> [String] {
    var addresses: [String] = []
    var interfaceList: UnsafeMutablePointer<ifaddrs>?
    guard getifaddrs(&interfaceList) == 0, let firstInterface = interfaceList else {
      return []
    }
    defer {
      freeifaddrs(interfaceList)
    }

    var pointer: UnsafeMutablePointer<ifaddrs>? = firstInterface
    while let current = pointer {
      let interface = current.pointee
      pointer = interface.ifa_next

      guard let interfaceAddress = interface.ifa_addr else {
        continue
      }
      let flags = Int32(bitPattern: interface.ifa_flags)
      guard (flags & IFF_UP) != 0, (flags & IFF_LOOPBACK) == 0 else {
        continue
      }
      guard interfaceAddress.pointee.sa_family == UInt8(AF_INET) else {
        continue
      }

      var hostBuffer = [CChar](repeating: 0, count: Int(NI_MAXHOST))
      let result = getnameinfo(
        interfaceAddress,
        socklen_t(interfaceAddress.pointee.sa_len),
        &hostBuffer,
        socklen_t(hostBuffer.count),
        nil,
        0,
        NI_NUMERICHOST
      )
      guard result == 0 else {
        continue
      }
      let address = String(cString: hostBuffer)
      if !address.isEmpty, !addresses.contains(address) {
        addresses.append(address)
      }
    }

    return addresses
  }
}
