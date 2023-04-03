// FBReactNativeSpec.h error after upgrading from 0.68.x to 0.69.0
// from: https://stackoverflow.com/questions/72729591/fbreactnativespec-h-error-after-upgrading-from-0-68-x-to-0-69-0/75907530#75907530

const {withDangerousMod, withPlugins} = require('@expo/config-plugins')
// const {ExpoConfig} = require('@expo/config-types')
const {mergeContents} = require('@expo/config-plugins/build/utils/generateCode')
const {readFileSync, writeFileSync} = require('fs')
const {resolve} = require('path')

const withFixedDeploymentTarget = (c) => {
  return withDangerousMod(c, [
    'ios',
    async (config) => {
      const file = resolve(config.modRequest.platformProjectRoot, 'Podfile')
      const contents = readFileSync(file, {encoding: 'utf-8'})
      writeFileSync(file, fixDeploymentTarget(contents))
      return config
    },
  ])
}

function fixDeploymentTarget(src) {
  return mergeContents({
    tag: `rn-fix-deployment-target`,
    src,
    newSrc: `

  # NOTE: Change IPHONEOS_DEPLOYMENT_TARGET to 13.
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
    end
  end
  __apply_Xcode_12_5_M1_post_install_workaround(installer)

`,
    anchor: /post_install/,
    offset: 1,
    comment: '#',
  }).contents
}

module.exports = (config) => withPlugins(config, [withFixedDeploymentTarget])
