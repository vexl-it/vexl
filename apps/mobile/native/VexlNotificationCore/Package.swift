// swift-tools-version: 6.1
import PackageDescription

let package = Package(
  name: "VexlNotificationCore",
  platforms: [.iOS("16.4"), .macOS(.v13)],
  products: [
    .library(name: "VexlNotificationCore", targets: ["VexlNotificationCore"])
  ],
  dependencies: [
    .package(url: "https://github.com/21-DOT-DEV/swift-secp256k1", exact: "0.23.2")
  ],
  targets: [
    .target(
      name: "VexlNotificationCore",
      dependencies: [
        .product(name: "P256K", package: "swift-secp256k1")
      ],
      resources: [
        .process("Resources")
      ]
    ),
    .testTarget(
      name: "VexlNotificationCoreTests",
      dependencies: ["VexlNotificationCore"]
    ),
  ]
)
