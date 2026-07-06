import UserNotifications
import VexlNotificationCore

/// Vexl chat-notification enricher (principal class of the VexlNSE target -
/// the generated Info.plist points NSExtensionPrincipalClass at
/// "$(PRODUCT_MODULE_NAME).NotificationService").
///
/// All real logic lives in VexlNotificationCore (testable via `swift test`).
/// This shell only enforces the delivery contract: the ORIGINAL generic
/// content is ALWAYS delivered unless enrichment fully succeeds before the
/// deadline - the NSE must never crash, block, or leak partial content.
final class NotificationService: UNNotificationServiceExtension {
  /// Overall enrichment budget. iOS gives the extension ~30s; stay well
  /// under it so serviceExtensionTimeWillExpire remains a rare fallback.
  private static let enrichmentDeadline: TimeInterval = 20

  /// Guards all mutable state below. The enrichment Task (cooperative pool)
  /// and serviceExtensionTimeWillExpire (system thread) race each other, so
  /// the check-and-clear of `contentHandler` must be atomic for the
  /// deliver-exactly-once contract to actually hold.
  private let stateLock = NSLock()
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var originalContent: UNNotificationContent?
  private var enrichmentTask: Task<Void, Never>?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    stateLock.lock()
    self.contentHandler = contentHandler
    self.originalContent = request.content
    stateLock.unlock()

    let userInfo = request.content.userInfo
    let enricher = Self.makeEnricher()

    let task = Task { [weak self] in
      let rendered = await Self.enrichWithTimeout(
        enricher: enricher,
        userInfo: userInfo
      )

      guard let self else { return }
      guard let rendered,
            let enrichedContent = request.content.mutableCopy()
            as? UNMutableNotificationContent
      else {
        self.deliverOriginal()
        return
      }

      rendered.apply(to: enrichedContent)
      self.deliver(enrichedContent)
    }

    stateLock.lock()
    enrichmentTask = task
    stateLock.unlock()
  }

  override func serviceExtensionTimeWillExpire() {
    stateLock.lock()
    let task = enrichmentTask
    stateLock.unlock()

    task?.cancel()
    deliverOriginal()
  }

  // MARK: - Delivery (exactly once)

  private func deliverOriginal() {
    stateLock.lock()
    let content = originalContent
    stateLock.unlock()

    if let content {
      deliver(content)
    }
  }

  private func deliver(_ content: UNNotificationContent) {
    stateLock.lock()
    let handler = contentHandler
    contentHandler = nil
    originalContent = nil
    stateLock.unlock()

    // Called outside the lock: the handler is system code we do not control.
    handler?(content)
  }

  // MARK: - Enrichment setup

  private static func makeEnricher() -> NotificationEnricher {
    let appGroupId = NseBridgeConstants.appGroupId(
      forExtensionBundleId: Bundle.main.bundleIdentifier ?? ""
    )
    return NotificationEnricher(
      keyStore: KeychainInboxKeyStore(accessGroup: appGroupId),
      metadataStore: AppGroupMetadataStore(appGroupId: appGroupId),
      http: UrlSessionHttpClient(requestTimeout: ChatApiClient.defaultRequestTimeout),
      appSemver: Bundle.main.object(
        forInfoDictionaryKey: "CFBundleShortVersionString"
      ) as? String
    )
  }

  /// Races enrichment against the deadline; any failure or timeout yields nil
  /// (=> deliver original).
  private static func enrichWithTimeout(
    enricher: NotificationEnricher,
    userInfo: [AnyHashable: Any]
  ) async -> RenderedNotification? {
    let result = await withTaskGroup(
      of: RenderedNotification?.self
    ) { group -> RenderedNotification? in
      group.addTask {
        await enricher.enrich(userInfo: userInfo)
      }
      group.addTask {
        try? await Task.sleep(nanoseconds: UInt64(enrichmentDeadline * 1_000_000_000))
        return nil
      }
      let first = await group.next() ?? nil
      group.cancelAll()
      return first
    }
    return result
  }
}
