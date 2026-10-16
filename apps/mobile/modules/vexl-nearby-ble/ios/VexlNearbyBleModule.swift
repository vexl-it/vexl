import ExpoModulesCore

private let keysDiscoveredEvent = "onNearbyKeysDiscovered"

public class VexlNearbyBleModule: Module {
  private lazy var ble = NearbyBle { [weak self] keys in
    self?.sendEvent(keysDiscoveredEvent, ["keys": keys])
  }

  public func definition() -> ModuleDefinition {
    Name("VexlNearbyBle")

    Events(keysDiscoveredEvent)

    OnDestroy {
      DispatchQueue.main.async { self.ble.stopAll() }
    }

    AsyncFunction("setAdvertisedKeys") { (keysBase64: [String]) in
      try self.ble.setAdvertisedKeys(keysBase64)
    }.runOnQueue(.main)

    AsyncFunction("startScanning") {
      try self.ble.startScanning()
    }.runOnQueue(.main)

    AsyncFunction("stopScanning") {
      self.ble.stopScanning()
    }.runOnQueue(.main)

    AsyncFunction("requestPermissions") { (promise: Promise) in
      self.ble.requestPermission { promise.resolve($0) }
    }.runOnQueue(.main)
  }
}
