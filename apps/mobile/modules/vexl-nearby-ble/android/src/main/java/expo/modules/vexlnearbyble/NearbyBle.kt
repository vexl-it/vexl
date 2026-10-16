package expo.modules.vexlnearbyble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.os.SystemClock
import android.util.Base64
import android.util.Log
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.CodedException
import java.util.UUID

internal class NearbyBleException(message: String) : CodedException(message)

/**
 * Process-wide BLE state shared by the Expo module and the foreground service.
 * State is only mutated on the main thread; BLE callbacks hop there first.
 */
@SuppressLint("MissingPermission") // JS requests permissions first; SecurityException is caught
internal object NearbyBle {
  private const val LOG_TAG = "VexlNearbyBle"
  private const val KEY_SIZE = 32
  // ATT caps an attribute value at 512 bytes.
  private const val MAX_KEYS = 512 / KEY_SIZE
  private const val REQUESTED_MTU = 512
  private const val DEVICE_REREAD_INTERVAL_MS = 2 * 60_000L
  private const val CONNECTION_TIMEOUT_MS = 15_000L

  private val SERVICE_UUID = UUID.fromString("b7e1c0de-5e7a-4c3e-9a1f-0f4d3c2b1a01")
  private val KEYS_CHARACTERISTIC_UUID = UUID.fromString("b7e1c0de-5e7a-4c3e-9a1f-0f4d3c2b1a02")

  private val handler = Handler(Looper.getMainLooper())
  private lateinit var context: Context

  var onKeysDiscovered: ((List<String>) -> Unit)? = null

  // Requested by JS; kept while Bluetooth is off so it can resume once it turns back on.
  // advertisedKeys is read from the GATT server binder thread.
  @Volatile private var advertisedKeys = ByteArray(0)
  private var wantScanning = false

  // What actually runs right now.
  @Volatile private var gattServer: BluetoothGattServer? = null
  private var advertising = false
  private var scanning = false

  private val lastReadAtByAddress = mutableMapOf<String, Long>()
  private val pendingDevices = ArrayDeque<BluetoothDevice>()
  private var activeGatt: BluetoothGatt? = null
  private val connectionTimeout = Runnable { activeGatt?.let(::finishRead) }

  // Follows the request, so the foreground service keeps the process alive while Bluetooth is off.
  val isActive: Boolean
    get() = isSharing || wantScanning

  val isSharing: Boolean
    get() = advertisedKeys.isNotEmpty()

  fun attach(context: Context) {
    if (::context.isInitialized) return
    this.context = context.applicationContext
    ContextCompat.registerReceiver(
      this.context,
      bluetoothStateReceiver,
      IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED),
      ContextCompat.RECEIVER_NOT_EXPORTED,
    )
  }

  fun setAdvertisedKeys(keysBase64: List<String>) {
    if (keysBase64.size > MAX_KEYS) {
      Log.w(LOG_TAG, "Advertising only the first $MAX_KEYS of ${keysBase64.size} keys")
    }
    advertisedKeys = keysBase64.take(MAX_KEYS).fold(ByteArray(0)) { acc, key -> acc + decodeKey(key) }

    syncingService {
      if (advertisedKeys.isEmpty()) {
        stopAdvertising()
      } else if (!advertising) {
        startAdvertising()
      }
    }
  }

  fun startScanning() {
    wantScanning = true
    syncingService(::startScan)
  }

  fun stopScanning() {
    wantScanning = false
    syncingService(::stopScan)
  }

  fun stopAll() {
    wantScanning = false
    setAdvertisedKeys(emptyList())
    stopScan()
  }

  private fun syncingService(block: () -> Unit) = try {
    block()
  } finally {
    NearbyBleService.sync(context)
  }

  private val bluetoothStateReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)) {
        BluetoothAdapter.STATE_TURNING_OFF, BluetoothAdapter.STATE_OFF -> {
          stopAdvertising()
          stopScan()
        }
        BluetoothAdapter.STATE_ON -> resumeRequested()
      }
    }
  }

  private fun resumeRequested() {
    logFailure { if (advertisedKeys.isNotEmpty() && !advertising) startAdvertising() }
    logFailure { if (wantScanning) startScan() }
  }

  private fun logFailure(block: () -> Unit) = try {
    block()
  } catch (exception: NearbyBleException) {
    Log.w(LOG_TAG, "Unable to resume after Bluetooth turned on: ${exception.message}")
  }

  private fun startScan() {
    if (scanning) return
    val scanner = requireEnabledAdapter().bluetoothLeScanner
      ?: throw NearbyBleException("Bluetooth LE scanning is not supported on this device")
    val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(SERVICE_UUID)).build()
    val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
    withBluetoothPermission { scanner.startScan(listOf(filter), settings, scanCallback) }
    scanning = true
  }

  private fun stopScan() {
    if (!scanning) return
    scanning = false
    stopQuietly { bluetoothManager()?.adapter?.bluetoothLeScanner?.stopScan(scanCallback) }
    pendingDevices.clear()
    activeGatt?.let(::finishRead)
  }

  private fun startAdvertising() {
    val advertiser = requireEnabledAdapter().bluetoothLeAdvertiser
      ?: throw NearbyBleException("Bluetooth LE advertising is not supported on this device")
    val server = withBluetoothPermission { bluetoothManager()?.openGattServer(context, gattServerCallback) }
      ?: throw NearbyBleException("Unable to open the Bluetooth GATT server")
    gattServer = server

    try {
      withBluetoothPermission {
        server.addService(keysService())
        advertiser.startAdvertising(advertiseSettings(), advertiseData(), advertiseCallback)
      }
    } catch (exception: NearbyBleException) {
      closeGattServer()
      throw exception
    }
    advertising = true
  }

  private fun stopAdvertising() {
    if (!advertising) return
    advertising = false
    stopQuietly { bluetoothManager()?.adapter?.bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback) }
    closeGattServer()
  }

  private fun closeGattServer() {
    ignoringSecurityException { gattServer?.close() }
    gattServer = null
  }

  private fun keysService() =
    BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY).apply {
      addCharacteristic(
        BluetoothGattCharacteristic(
          KEYS_CHARACTERISTIC_UUID,
          BluetoothGattCharacteristic.PROPERTY_READ,
          BluetoothGattCharacteristic.PERMISSION_READ,
        ),
      )
    }

  private fun advertiseSettings() = AdvertiseSettings.Builder()
    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
    .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
    .setConnectable(true)
    .setTimeout(0)
    .build()

  // No device name: a 128-bit service UUID plus flags already uses 21 of the 31 bytes.
  private fun advertiseData() = AdvertiseData.Builder()
    .setIncludeDeviceName(false)
    .setIncludeTxPowerLevel(false)
    .addServiceUuid(ParcelUuid(SERVICE_UUID))
    .build()

  private val advertiseCallback = object : AdvertiseCallback() {
    override fun onStartFailure(errorCode: Int) {
      Log.w(LOG_TAG, "Advertising failed to start: $errorCode")
      handler.post(::stopAdvertising)
    }
  }

  private val gattServerCallback = object : BluetoothGattServerCallback() {
    override fun onCharacteristicReadRequest(
      device: BluetoothDevice,
      requestId: Int,
      offset: Int,
      characteristic: BluetoothGattCharacteristic,
    ) {
      val value = advertisedKeys
      val server = gattServer ?: return
      val (status, response) = when {
        characteristic.uuid != KEYS_CHARACTERISTIC_UUID -> BluetoothGatt.GATT_READ_NOT_PERMITTED to null
        offset > value.size -> BluetoothGatt.GATT_INVALID_OFFSET to null
        else -> BluetoothGatt.GATT_SUCCESS to value.copyOfRange(offset, value.size)
      }
      ignoringSecurityException { server.sendResponse(device, requestId, status, offset, response) }
    }
  }

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      handler.post { enqueue(result.device) }
    }

    override fun onBatchScanResults(results: MutableList<ScanResult>) {
      handler.post { results.forEach { enqueue(it.device) } }
    }

    override fun onScanFailed(errorCode: Int) {
      Log.w(LOG_TAG, "Scan failed: $errorCode")
    }
  }

  private fun enqueue(device: BluetoothDevice) {
    val now = SystemClock.elapsedRealtime()
    lastReadAtByAddress.entries.removeAll { now - it.value >= DEVICE_REREAD_INTERVAL_MS }
    if (!scanning || device.address in lastReadAtByAddress) return
    if (pendingDevices.any { it.address == device.address }) return
    pendingDevices.addLast(device)
    readNext()
  }

  private fun readNext() {
    if (activeGatt != null || !scanning) return
    val device = pendingDevices.removeFirstOrNull() ?: return
    lastReadAtByAddress[device.address] = SystemClock.elapsedRealtime()
    val gatt = ignoringSecurityException {
      device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
    }
    if (gatt == null) return readNext()
    activeGatt = gatt
    handler.postDelayed(connectionTimeout, CONNECTION_TIMEOUT_MS)
  }

  private fun finishRead(gatt: BluetoothGatt) {
    if (gatt != activeGatt) return
    handler.removeCallbacks(connectionTimeout)
    ignoringSecurityException {
      gatt.disconnect()
      gatt.close()
    }
    activeGatt = null
    readNext()
  }

  private val gattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      handler.post {
        if (status == BluetoothGatt.GATT_SUCCESS && newState == BluetoothProfile.STATE_CONNECTED) {
          gattStep(gatt) { gatt.requestMtu(REQUESTED_MTU) }
        } else {
          finishRead(gatt)
        }
      }
    }

    // A failed MTU negotiation still allows a (slower) long read.
    override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
      handler.post { gattStep(gatt) { gatt.discoverServices() } }
    }

    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
      handler.post {
        val characteristic = gatt.getService(SERVICE_UUID)?.getCharacteristic(KEYS_CHARACTERISTIC_UUID)
        if (status == BluetoothGatt.GATT_SUCCESS && characteristic != null) {
          gattStep(gatt) { gatt.readCharacteristic(characteristic) }
        } else {
          finishRead(gatt)
        }
      }
    }

    // Android calls this deprecated overload on every API level, including 33+.
    @Deprecated("Deprecated in Java")
    override fun onCharacteristicRead(
      gatt: BluetoothGatt,
      characteristic: BluetoothGattCharacteristic,
      status: Int,
    ) {
      @Suppress("DEPRECATION")
      val value = characteristic.value?.copyOf()
      handler.post {
        if (gatt != activeGatt) return@post
        if (status == BluetoothGatt.GATT_SUCCESS && value != null) emitKeys(value)
        finishRead(gatt)
      }
    }
  }

  private fun gattStep(gatt: BluetoothGatt, step: () -> Boolean) {
    if (gatt != activeGatt) return
    if (ignoringSecurityException(step) != true) finishRead(gatt)
  }

  private fun emitKeys(value: ByteArray) {
    val keys = (0 until value.size / KEY_SIZE).map { index ->
      Base64.encodeToString(value.copyOfRange(index * KEY_SIZE, (index + 1) * KEY_SIZE), Base64.NO_WRAP)
    }
    if (keys.isNotEmpty()) onKeysDiscovered?.invoke(keys)
  }

  private fun bluetoothManager(): BluetoothManager? = context.getSystemService(BluetoothManager::class.java)

  private fun requireEnabledAdapter(): BluetoothAdapter {
    val adapter = bluetoothManager()?.adapter ?: throw NearbyBleException("Bluetooth is not available on this device")
    if (!adapter.isEnabled) throw NearbyBleException("Bluetooth is turned off")
    return adapter
  }

  private fun <T> withBluetoothPermission(block: () -> T): T = try {
    block()
  } catch (exception: SecurityException) {
    throw NearbyBleException("Missing Bluetooth permission")
  }

  private fun <T> ignoringSecurityException(block: () -> T): T? = try {
    block()
  } catch (exception: SecurityException) {
    Log.w(LOG_TAG, "Bluetooth call rejected: missing permission")
    null
  }

  // Stopping races the adapter turning off, which throws IllegalStateException.
  private fun stopQuietly(block: () -> Unit) {
    try {
      ignoringSecurityException(block)
    } catch (exception: IllegalStateException) {
      Log.w(LOG_TAG, "Bluetooth stop call rejected: adapter is off")
    }
  }

  private fun decodeKey(keyBase64: String): ByteArray {
    val key = try {
      Base64.decode(keyBase64, Base64.DEFAULT)
    } catch (exception: IllegalArgumentException) {
      throw NearbyBleException("Nearby key is not valid base64")
    }
    if (key.size != KEY_SIZE) throw NearbyBleException("Nearby key must be $KEY_SIZE bytes")
    return key
  }
}
