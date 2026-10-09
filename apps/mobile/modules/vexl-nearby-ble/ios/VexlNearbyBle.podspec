Pod::Spec.new do |s|
  s.name           = 'VexlNearbyBle'
  s.version        = '1.0.0'
  s.summary        = 'Exchanges nearby offer keys over Bluetooth LE'
  s.description    = <<-DESC
    Local Expo module. Advertises nearby offer keys from a GATT peripheral and
    reads them from nearby peripherals as a central. See docs/nearby_offers.md.
  DESC
  s.author         = 'Vexl'
  s.homepage       = 'https://vexl.it'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreBluetooth'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = '**/*.{h,m,mm,swift}'
end
