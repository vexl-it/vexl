import CoreBluetooth
import ExpoModulesCore

internal final class NearbyBleException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    param
  }
}

/// Peripheral advertising nearby offer keys plus a central reading them from
/// others. Wire format: docs/nearby_offers.md. Main thread only.
internal final class NearbyBle: NSObject {
  private static let serviceUUID = CBUUID(string: "B7E1C0DE-5E7A-4C3E-9A1F-0F4D3C2B1A01")
  private static let keysCharacteristicUUID = CBUUID(string: "B7E1C0DE-5E7A-4C3E-9A1F-0F4D3C2B1A02")
  private static let keySize = 32
  // ATT caps an attribute value at 512 bytes.
  private static let maxKeys = 512 / keySize
  private static let deviceRereadInterval: TimeInterval = 120
  private static let connectionTimeout: TimeInterval = 15

  private let onKeysDiscovered: ([String]) -> Void

  // Created lazily: instantiating a manager shows the Bluetooth permission prompt.
  private var peripheralManager: CBPeripheralManager?
  private var centralManager: CBCentralManager?

  private var advertisedKeys = Data()
  private var serviceAdded = false
  private var scanningWanted = false
  private var permissionCallbacks: [(Bool) -> Void] = []

  private var lastReadAtByPeripheral: [UUID: Date] = [:]
  private var pendingPeripherals: [CBPeripheral] = []
  private var activePeripheral: CBPeripheral?
  private var connectionTimeoutWork: DispatchWorkItem?

  init(onKeysDiscovered: @escaping ([String]) -> Void) {
    self.onKeysDiscovered = onKeysDiscovered
  }

  func setAdvertisedKeys(_ keysBase64: [String]) throws {
    advertisedKeys = try keysBase64.prefix(Self.maxKeys).reduce(into: Data()) { data, key in
      data.append(try Self.decodeKey(key))
    }
    if advertisedKeys.isEmpty {
      stopAdvertising()
      return
    }
    try ensureUsable(peripheralManager?.state)
    if peripheralManager == nil {
      peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    } else {
      startAdvertisingIfReady()
    }
  }

  func startScanning() throws {
    try ensureUsable(centralManager?.state)
    scanningWanted = true
    if centralManager == nil {
      centralManager = CBCentralManager(delegate: self, queue: nil)
    } else {
      startScanIfReady()
    }
  }

  func stopScanning() {
    scanningWanted = false
    if centralManager?.state == .poweredOn {
      centralManager?.stopScan()
    }
    pendingPeripherals.removeAll()
    if let peripheral = activePeripheral {
      finishRead(peripheral)
    }
  }

  func stopAll() {
    stopAdvertising()
    stopScanning()
  }

  func requestPermission(_ callback: @escaping (Bool) -> Void) {
    switch CBManager.authorization {
    case .allowedAlways:
      callback(true)
    case .notDetermined:
      permissionCallbacks.append(callback)
      if centralManager == nil {
        centralManager = CBCentralManager(delegate: self, queue: nil)
      }
    default:
      callback(false)
    }
  }

  private func resolvePermissionCallbacks() {
    guard CBManager.authorization != .notDetermined else { return }
    let granted = CBManager.authorization == .allowedAlways
    permissionCallbacks.forEach { $0(granted) }
    permissionCallbacks.removeAll()
  }

  /// Rejects only states known to be unusable; `nil` / `.unknown` resolve later.
  private func ensureUsable(_ state: CBManagerState?) throws {
    switch state {
    case .poweredOff:
      throw NearbyBleException("Bluetooth is turned off")
    case .unauthorized:
      throw NearbyBleException("Missing Bluetooth permission")
    case .unsupported:
      throw NearbyBleException("Bluetooth LE is not supported on this device")
    default:
      break
    }
  }

  // MARK: - Peripheral

  private func startAdvertisingIfReady() {
    guard let manager = peripheralManager, manager.state == .poweredOn, !advertisedKeys.isEmpty else { return }
    if !serviceAdded {
      let service = CBMutableService(type: Self.serviceUUID, primary: true)
      service.characteristics = [
        CBMutableCharacteristic(
          type: Self.keysCharacteristicUUID,
          properties: .read,
          value: nil,
          permissions: .readable
        ),
      ]
      manager.add(service)
      serviceAdded = true
    }
    if !manager.isAdvertising {
      manager.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [Self.serviceUUID]])
    }
  }

  private func stopAdvertising() {
    advertisedKeys = Data()
    guard let manager = peripheralManager else { return }
    if manager.state == .poweredOn {
      manager.stopAdvertising()
      manager.removeAllServices()
    }
    serviceAdded = false
  }

  // MARK: - Central

  private func startScanIfReady() {
    guard scanningWanted, let manager = centralManager, manager.state == .poweredOn, !manager.isScanning else {
      return
    }
    manager.scanForPeripherals(withServices: [Self.serviceUUID])
  }

  private func enqueue(_ peripheral: CBPeripheral) {
    let now = Date()
    lastReadAtByPeripheral = lastReadAtByPeripheral.filter { now.timeIntervalSince($0.value) < Self.deviceRereadInterval }
    guard scanningWanted,
          lastReadAtByPeripheral[peripheral.identifier] == nil,
          !pendingPeripherals.contains(where: { $0.identifier == peripheral.identifier })
    else { return }
    pendingPeripherals.append(peripheral)
    readNext()
  }

  private func readNext() {
    guard activePeripheral == nil, scanningWanted, let manager = centralManager, !pendingPeripherals.isEmpty else {
      return
    }
    let peripheral = pendingPeripherals.removeFirst()
    lastReadAtByPeripheral[peripheral.identifier] = Date()
    activePeripheral = peripheral
    peripheral.delegate = self
    manager.connect(peripheral)

    let timeout = DispatchWorkItem { [weak self] in self?.finishRead(peripheral) }
    connectionTimeoutWork = timeout
    DispatchQueue.main.asyncAfter(deadline: .now() + Self.connectionTimeout, execute: timeout)
  }

  private func finishRead(_ peripheral: CBPeripheral) {
    guard peripheral == activePeripheral else { return }
    connectionTimeoutWork?.cancel()
    connectionTimeoutWork = nil
    centralManager?.cancelPeripheralConnection(peripheral)
    activePeripheral = nil
    readNext()
  }

  private func emitKeys(_ value: Data) {
    let keys = (0..<(value.count / Self.keySize)).map { index in
      value.subdata(in: (index * Self.keySize)..<((index + 1) * Self.keySize)).base64EncodedString()
    }
    if !keys.isEmpty {
      onKeysDiscovered(keys)
    }
  }

  private static func decodeKey(_ keyBase64: String) throws -> Data {
    guard let key = Data(base64Encoded: keyBase64) else {
      throw NearbyBleException("Nearby key is not valid base64")
    }
    guard key.count == keySize else {
      throw NearbyBleException("Nearby key must be \(keySize) bytes")
    }
    return key
  }
}

extension NearbyBle: CBPeripheralManagerDelegate {
  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    resolvePermissionCallbacks()
    if peripheral.state == .poweredOn {
      startAdvertisingIfReady()
    } else {
      // Services are dropped when Bluetooth goes down; re-add on power on.
      serviceAdded = false
    }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
    guard request.characteristic.uuid == Self.keysCharacteristicUUID else {
      peripheral.respond(to: request, withResult: .readNotPermitted)
      return
    }
    guard request.offset <= advertisedKeys.count else {
      peripheral.respond(to: request, withResult: .invalidOffset)
      return
    }
    request.value = advertisedKeys.subdata(in: request.offset..<advertisedKeys.count)
    peripheral.respond(to: request, withResult: .success)
  }
}

extension NearbyBle: CBCentralManagerDelegate {
  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    resolvePermissionCallbacks()
    startScanIfReady()
  }

  func centralManager(
    _ central: CBCentralManager,
    didDiscover peripheral: CBPeripheral,
    advertisementData: [String: Any],
    rssi RSSI: NSNumber
  ) {
    enqueue(peripheral)
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    peripheral.discoverServices([Self.serviceUUID])
  }

  func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
    finishRead(peripheral)
  }

  func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    finishRead(peripheral)
  }
}

extension NearbyBle: CBPeripheralDelegate {
  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    guard let service = peripheral.services?.first(where: { $0.uuid == Self.serviceUUID }) else {
      finishRead(peripheral)
      return
    }
    peripheral.discoverCharacteristics([Self.keysCharacteristicUUID], for: service)
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
    guard let characteristic = service.characteristics?.first(where: { $0.uuid == Self.keysCharacteristicUUID }) else {
      finishRead(peripheral)
      return
    }
    peripheral.readValue(for: characteristic)
  }

  func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
    if error == nil, let value = characteristic.value {
      emitKeys(value)
    }
    finishRead(peripheral)
  }
}
