package expo.modules.vexllocaltransport

import android.util.Base64
import androidx.core.os.bundleOf
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.IOException
import java.net.Inet4Address
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.net.SocketTimeoutException
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException
import java.util.concurrent.atomic.AtomicBoolean

// Read loop chunk size. Must stay in sync with the data chunk plaintext limit
// declared in packages/domain/src/general/deviceMigration/limits.ts.
private const val MAX_RECEIVE_CHUNK_BYTES = 64 * 1024

private class ListenerAlreadyActiveException :
  CodedException("A local transport listener is already active")

private class ListenerStartFailedException :
  CodedException("The local transport listener could not be started")

private class NoActiveListenerException :
  CodedException("No local transport listener is active")

private class InvalidPortException :
  CodedException("Port must be an integer between 1 and 65535")

private class ConnectFailedException :
  CodedException("The local transport connection could not be established")

private class ConnectTimedOutException :
  CodedException("The local transport connection attempt timed out or was cancelled")

private class ConnectionNotFoundException :
  CodedException("No open local transport connection with the given id exists")

private class InvalidBase64PayloadException :
  CodedException("The payload is not valid base64")

private class SendFailedException :
  CodedException("Sending on the local transport connection failed")

/**
 * Minimal local-network TCP transport used exclusively by device migration.
 *
 * Deliberately thin: framing, limits, timeouts and the protocol state machine
 * live in the javascript protocol layer. There is no TLS at this layer — the
 * application-layer secretstream encrypts every byte. No mDNS/NSD is used;
 * the pairing QR carries the reachable endpoints.
 *
 * Privacy: nothing handled here (payloads, hosts, ports) may ever be logged
 * or reported. Errors crossing the bridge carry only the static messages of
 * the typed exceptions above.
 */
class VexlLocalTransportModule : Module() {
  private val stateLock = Any()
  private var serverSocket: ServerSocket? = null
  private var hasAcceptedInboundConnection = false
  private var destroyed = false
  private val connections = ConcurrentHashMap<String, ConnectionHandle>()

  override fun definition() = ModuleDefinition {
    Name("VexlLocalTransport")

    Events("onConnectionAccepted", "onData", "onConnectionClosed", "onListenerFailed")

    AsyncFunction("startListener") { promise: Promise ->
      synchronized(stateLock) {
        if (serverSocket != null) {
          promise.reject(ListenerAlreadyActiveException())
          return@AsyncFunction
        }
        val socket = try {
          // Port 0 — the system assigns an ephemeral port bound on all
          // interfaces (wildcard address).
          ServerSocket(0)
        } catch (exception: IOException) {
          promise.reject(ListenerStartFailedException())
          return@AsyncFunction
        }
        serverSocket = socket
        hasAcceptedInboundConnection = false
        Thread { acceptLoop(socket) }.apply {
          isDaemon = true
          name = "vexl-local-transport-accept"
          start()
        }
        promise.resolve(bundleOf("port" to socket.localPort))
      }
    }

    AsyncFunction("getLocalEndpointCandidates") { promise: Promise ->
      val port = synchronized(stateLock) { serverSocket?.localPort }
      if (port == null) {
        promise.reject(NoActiveListenerException())
        return@AsyncFunction
      }
      promise.resolve(
        nonLoopbackIpv4Addresses().map { bundleOf("host" to it, "port" to port) }
      )
    }

    AsyncFunction("stopListener") { promise: Promise ->
      stopListener()
      promise.resolve(null)
    }

    AsyncFunction("connect") { host: String, port: Int, timeoutMs: Int, promise: Promise ->
      if (port < 1 || port > 65535) {
        promise.reject(InvalidPortException())
        return@AsyncFunction
      }
      // A dedicated thread so a slow connect attempt cannot block other
      // module calls. The blocking connect itself enforces the timeout.
      Thread {
        val socket = Socket()
        try {
          socket.tcpNoDelay = true
          socket.connect(InetSocketAddress(host, port), timeoutMs.coerceAtLeast(0))
          val handle = registerConnection(socket)
          promise.resolve(bundleOf("connectionId" to handle.id))
        } catch (exception: SocketTimeoutException) {
          closeQuietly(socket)
          promise.reject(ConnectTimedOutException())
        } catch (exception: Exception) {
          closeQuietly(socket)
          promise.reject(ConnectFailedException())
        }
      }.apply {
        isDaemon = true
        name = "vexl-local-transport-connect"
        start()
      }
    }

    AsyncFunction("send") { connectionId: String, dataBase64: String, promise: Promise ->
      val handle = connections[connectionId]
      if (handle == null) {
        promise.reject(ConnectionNotFoundException())
        return@AsyncFunction
      }
      val data = try {
        Base64.decode(dataBase64, Base64.DEFAULT)
      } catch (exception: IllegalArgumentException) {
        promise.reject(InvalidBase64PayloadException())
        return@AsyncFunction
      }
      handle.send(data, promise)
    }

    AsyncFunction("closeConnection") { connectionId: String, promise: Promise ->
      // Idempotent — closing an unknown or already closed connection is a
      // no-op success.
      connections[connectionId]?.close(locally = true)
      promise.resolve(null)
    }

    OnDestroy {
      synchronized(stateLock) {
        destroyed = true
      }
      stopListener()
      val openConnections = connections.values.toList()
      connections.clear()
      for (handle in openConnections) {
        handle.shutdownSilently()
      }
    }
  }

  private fun stopListener() {
    val socket = synchronized(stateLock) {
      val current = serverSocket
      serverSocket = null
      current
    }
    if (socket != null) {
      try {
        socket.close()
      } catch (exception: IOException) {
        // Already closed — nothing else to release.
      }
    }
  }

  private fun acceptLoop(listeningSocket: ServerSocket) {
    while (true) {
      val socket = try {
        listeningSocket.accept()
      } catch (exception: IOException) {
        val wasStopped = synchronized(stateLock) {
          destroyed || serverSocket !== listeningSocket
        }
        if (!wasStopped) {
          synchronized(stateLock) {
            if (serverSocket === listeningSocket) serverSocket = null
          }
          closeQuietly(listeningSocket)
          sendEvent("onListenerFailed", bundleOf("reason" to "error"))
        }
        return
      }

      val acceptThisSocket = synchronized(stateLock) {
        if (hasAcceptedInboundConnection) {
          false
        } else {
          hasAcceptedInboundConnection = true
          true
        }
      }
      if (!acceptThisSocket) {
        // At most one inbound peer is ever accepted per listener session.
        // Later connection attempts are refused outright and never surfaced
        // to javascript. The typescript wrapper enforces this too.
        closeQuietly(socket)
        continue
      }

      try {
        socket.tcpNoDelay = true
      } catch (exception: SocketException) {
        // Best effort only.
      }
      val handle = registerConnection(socket)
      sendEvent(
        "onConnectionAccepted",
        bundleOf(
          "connectionId" to handle.id,
          "remoteHost" to (socket.inetAddress?.hostAddress ?: "")
        )
      )
    }
  }

  private fun registerConnection(socket: Socket): ConnectionHandle {
    val handle = ConnectionHandle(UUID.randomUUID().toString(), socket)
    connections[handle.id] = handle
    handle.startReadLoop()
    return handle
  }

  private fun nonLoopbackIpv4Addresses(): List<String> {
    val addresses = mutableListOf<String>()
    try {
      for (networkInterface in NetworkInterface.getNetworkInterfaces()) {
        if (!networkInterface.isUp || networkInterface.isLoopback) continue
        for (address in networkInterface.inetAddresses) {
          if (address is Inet4Address && !address.isLoopbackAddress) {
            val host = address.hostAddress
            if (host != null && !addresses.contains(host)) {
              addresses.add(host)
            }
          }
        }
      }
    } catch (exception: SocketException) {
      // No interfaces readable — return what was collected so far.
    }
    return addresses
  }

  private fun closeQuietly(socket: Socket) {
    try {
      socket.close()
    } catch (exception: IOException) {
      // Already closed.
    }
  }

  private fun closeQuietly(socket: ServerSocket) {
    try {
      socket.close()
    } catch (exception: IOException) {
      // Already closed.
    }
  }

  private inner class ConnectionHandle(val id: String, val socket: Socket) {
    private val closed = AtomicBoolean(false)
    private val closedLocally = AtomicBoolean(false)
    private val silent = AtomicBoolean(false)
    // Serializes writes and provides backpressure — a send promise resolves
    // only after the blocking write handed the bytes to the OS buffer.
    private val writeExecutor: ExecutorService =
      Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable).apply {
          isDaemon = true
          name = "vexl-local-transport-write"
        }
      }

    fun startReadLoop() {
      Thread {
        val buffer = ByteArray(MAX_RECEIVE_CHUNK_BYTES)
        try {
          val input = socket.getInputStream()
          while (true) {
            val readCount = input.read(buffer)
            if (readCount == -1) {
              close(locally = false, reason = "closedByPeer")
              return@Thread
            }
            if (readCount > 0 && !closed.get()) {
              sendEvent(
                "onData",
                bundleOf(
                  "connectionId" to id,
                  "dataBase64" to Base64.encodeToString(buffer, 0, readCount, Base64.NO_WRAP)
                )
              )
            }
          }
        } catch (exception: IOException) {
          close(
            locally = false,
            reason = if (closedLocally.get()) "cancelled" else "error"
          )
        }
      }.apply {
        isDaemon = true
        name = "vexl-local-transport-read"
        start()
      }
    }

    fun send(data: ByteArray, promise: Promise) {
      try {
        writeExecutor.execute {
          try {
            val output = socket.getOutputStream()
            output.write(data)
            output.flush()
            promise.resolve(null)
          } catch (exception: IOException) {
            promise.reject(SendFailedException())
          }
        }
      } catch (exception: RejectedExecutionException) {
        // The connection was closed and its write executor shut down.
        promise.reject(ConnectionNotFoundException())
      }
    }

    fun close(locally: Boolean, reason: String = "cancelled") {
      if (locally) {
        closedLocally.set(true)
      }
      if (!closed.compareAndSet(false, true)) return
      connections.remove(id)
      writeExecutor.shutdown()
      closeQuietly(socket)
      if (!silent.get()) {
        sendEvent(
          "onConnectionClosed",
          bundleOf("connectionId" to id, "reason" to reason)
        )
      }
    }

    /** Close during module destruction — javascript is gone, emit nothing. */
    fun shutdownSilently() {
      silent.set(true)
      closedLocally.set(true)
      close(locally = true)
    }
  }
}
