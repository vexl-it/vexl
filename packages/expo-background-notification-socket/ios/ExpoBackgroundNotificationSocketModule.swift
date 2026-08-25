import ExpoModulesCore

public class ExpoBackgroundNotificationSocketModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundNotificationSocket")

    AsyncFunction("configure") { (_: String, _: String, _: String, _: Int) in }
    AsyncFunction("clearCredentials") {}
    AsyncFunction("setEnabled") { (_: Bool) in }
    AsyncFunction("getEnabledPreference") { () -> Bool? in nil }
    AsyncFunction("requestBatteryExemption") {}
    AsyncFunction("isBatteryExempt") { true }
    AsyncFunction("isGmsAvailable") { false }
    AsyncFunction("getState") { "disabled" }
    AsyncFunction("setForegroundStreamConnected") { (_: Bool) in }
  }
}
