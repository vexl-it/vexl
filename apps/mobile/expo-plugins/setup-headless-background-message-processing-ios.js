const {withAppDelegate} = require('expo/config-plugins')

// updated according to https://rnfirebase.io/messaging/usage#background-application-state
module.exports = function withHeadlessBackgroundMessageProcessing(config) {
  return withAppDelegate(config, (config) => {
    const {contents} = config.modResults

    let newContents = `#import "RNFBMessagingModule.h"\n${contents}`
    newContents = newContents.replace(
      'self.initialProps = @{};',
      'self.initialProps = [RNFBMessagingModule addCustomPropsToUserProps:nil withLaunchOptions:launchOptions];'
    )

    config.modResults = {
      ...config.modResults,
      contents: newContents,
    }

    return config
  })
}
