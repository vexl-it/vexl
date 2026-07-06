Pod::Spec.new do |s|
  s.name           = 'VexlNseBridge'
  s.version        = '1.0.0'
  s.summary        = 'Syncs NSE chat-preview data into the shared keychain and app group'
  s.description    = <<-DESC
    Local Expo module (iOS only). Writes vexl-token -> inbox-private-key
    entries into the shared keychain access group and non-secret metadata
    (sender names, service URLs, locale) into the App Group container so the
    notification service extension (targets/vexl-nse) can render rich chat
    notification previews.
  DESC
  s.author         = 'Vexl'
  s.homepage       = 'https://vexl.it'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = '**/*.{h,m,mm,swift}'
end
