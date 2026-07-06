/**
 * Links the local Swift package apps/mobile/native/VexlNotificationCore into
 * the VexlNSE notification-service extension target created by
 * @bacons/apple-targets. The remote swift-secp256k1 dependency is declared in
 * the package's Package.swift, so Xcode resolves it transitively.
 *
 * IMPORTANT ordering: this plugin must be listed BEFORE '@bacons/apple-targets'
 * in app.config.ts plugins. @expo/config-plugins runs the LAST registered mod
 * action FIRST, so listing this one earlier makes apple-targets' action (which
 * creates the VexlNSE target) execute before this action runs.
 */
const {withMod} = require('expo/config-plugins')

const TARGET_NAME = 'VexlNSE'
// Relative to the generated ios/ directory.
const PACKAGE_RELATIVE_PATH = '../native/VexlNotificationCore'
const PRODUCT_NAME = 'VexlNotificationCore'

module.exports = function withNseLocalSpm(config) {
  return withMod(config, {
    platform: 'ios',
    // Custom base mod registered by @bacons/apple-targets
    // (with-bacons-xcode.ts); modResults is a @bacons/xcode XcodeProject.
    mod: 'xcodeProjectBeta2',
    action(modConfig) {
      const {
        PBXBuildFile,
        XCLocalSwiftPackageReference,
        XCSwiftPackageProductDependency,
      } = require('@bacons/xcode')

      const project = modConfig.modResults
      const target = project.rootObject.props.targets.find(
        (one) => one.props.productName === TARGET_NAME
      )
      if (!target) {
        throw new Error(
          `[with-nse-local-spm] ${TARGET_NAME} target not found. ` +
            `Is '@bacons/apple-targets' listed AFTER './expo-plugins/with-nse-local-spm.js' in app.config.ts plugins?`
        )
      }

      const alreadyLinked = (
        project.rootObject.props.packageReferences ?? []
      ).some((ref) => ref.props.relativePath === PACKAGE_RELATIVE_PATH)
      if (alreadyLinked) return modConfig

      const packageReference = XCLocalSwiftPackageReference.create(project, {
        relativePath: PACKAGE_RELATIVE_PATH,
      })
      if (!project.rootObject.props.packageReferences) {
        project.rootObject.props.packageReferences = []
      }
      project.rootObject.props.packageReferences.push(packageReference)

      const productDependency = XCSwiftPackageProductDependency.create(
        project,
        {productName: PRODUCT_NAME}
      )
      if (!target.props.packageProductDependencies) {
        target.props.packageProductDependencies = []
      }
      target.props.packageProductDependencies.push(productDependency)

      const frameworksPhase = target.getFrameworksBuildPhase()
      frameworksPhase.props.files.push(
        PBXBuildFile.create(project, {productRef: productDependency})
      )

      return modConfig
    },
  })
}
