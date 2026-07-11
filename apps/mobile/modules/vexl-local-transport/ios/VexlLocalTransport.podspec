Pod::Spec.new do |s|
  s.name           = 'VexlLocalTransport'
  s.version        = '0.1.0'
  s.summary        = 'Local TCP transport for Vexl device migration'
  s.description    = 'In-repository Expo module exposing a minimal local-network TCP transport (listener, endpoint discovery, framed byte streams) used exclusively by the device migration flow. No TLS at this layer — the application-layer secretstream encrypts everything.'
  s.author         = 'Vexl'
  s.homepage       = 'https://vexl.it'
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
