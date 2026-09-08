import ExpoModulesCore

public class ExpoIosBackupExclusionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoIosBackupExclusion")

    // The flag lives on the directory, so it must exist before it can be set.
    Function("excludeDirectoryFromBackup") { (uri: String) in
      guard var url = URL(string: uri), url.isFileURL else {
        throw Exception(name: "InvalidUri", description: "Expected a file:// URI, got \(uri)")
      }
      try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try url.setResourceValues(values)
    }
  }
}
