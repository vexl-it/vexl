package expo.modules.vexlnearbyble

import android.Manifest
import android.os.Build
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val KEYS_DISCOVERED_EVENT = "onNearbyKeysDiscovered"

class VexlNearbyBleModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VexlNearbyBle")

    Events(KEYS_DISCOVERED_EVENT)

    OnCreate {
      NearbyBle.attach(requireNotNull(appContext.reactContext))
      NearbyBle.onKeysDiscovered = { keys -> sendEvent(KEYS_DISCOVERED_EVENT, mapOf("keys" to keys)) }
    }

    OnDestroy {
      NearbyBle.onKeysDiscovered = null
    }

    AsyncFunction("setAdvertisedKeys") { keysBase64: List<String> ->
      NearbyBle.setAdvertisedKeys(keysBase64)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("startScanning") {
      NearbyBle.startScanning()
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stopScanning") {
      NearbyBle.stopScanning()
    }.runOnQueue(Queues.MAIN)

    // Resolves with the Bluetooth grants only: a denied notification permission
    // just hides the foreground service notification. Below Android 12 scanning
    // would need the location permission, so the feature is unsupported there.
    AsyncFunction("requestPermissions") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        promise.resolve(false)
        return@AsyncFunction
      }
      val permissionsManager = appContext.permissions
      if (permissionsManager == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      val notificationPermissions =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) arrayOf(Manifest.permission.POST_NOTIFICATIONS) else emptyArray()
      permissionsManager.askForPermissions(
        { result ->
          promise.resolve(BLUETOOTH_PERMISSIONS.all { result[it]?.status == PermissionsStatus.GRANTED })
        },
        *BLUETOOTH_PERMISSIONS,
        *notificationPermissions,
      )
    }
  }

  private companion object {
    val BLUETOOTH_PERMISSIONS = arrayOf(
      Manifest.permission.BLUETOOTH_SCAN,
      Manifest.permission.BLUETOOTH_ADVERTISE,
      Manifest.permission.BLUETOOTH_CONNECT,
    )
  }
}
