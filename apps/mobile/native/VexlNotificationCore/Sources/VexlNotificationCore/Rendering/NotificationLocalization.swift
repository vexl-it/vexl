import Foundation

/// Localized title/body pairs for the renderable message types, generated
/// from packages/localization/<locale>-base.json by
/// scripts/generateNotificationLocalizations.mjs (checked-in resource).
public struct NotificationLocalization: Sendable {
  public struct Entry: Codable, Equatable, Sendable {
    public let title: String
    public let body: String
  }

  public static let fallbackLocale = "en"

  private let tables: [String: [String: Entry]]

  init(tables: [String: [String: Entry]]) {
    self.tables = tables
  }

  /// Loads the bundled resource. Returns nil only if the bundle is broken -
  /// callers should bail to generic content in that case.
  public static func loadBundled() -> NotificationLocalization? {
    guard let url = Bundle.module.url(
      forResource: "notificationLocalizations",
      withExtension: "json"
    ),
      let data = try? Data(contentsOf: url),
      let tables = try? JSONDecoder().decode([String: [String: Entry]].self, from: data)
    else {
      return nil
    }
    return NotificationLocalization(tables: tables)
  }

  /// Normalizes a locale string ("cs", "en-US", "pt_BR") to a table key.
  static func normalize(locale: String) -> String {
    locale
      .lowercased()
      .split(whereSeparator: { $0 == "-" || $0 == "_" })
      .first
      .map(String.init) ?? locale.lowercased()
  }

  /// Localized entry for a message type, with per-key fallback to English.
  public func entry(
    for type: RenderableMessageType,
    locale: String
  ) -> Entry? {
    let normalized = Self.normalize(locale: locale)
    if let entry = tables[normalized]?[type.rawValue] {
      return entry
    }
    return tables[Self.fallbackLocale]?[type.rawValue]
  }
}

/// Replaces `{{them}}` placeholders the same way the app's i18n does.
func interpolateThem(_ template: String, them: String) -> String {
  template.replacingOccurrences(of: "{{them}}", with: them)
}
