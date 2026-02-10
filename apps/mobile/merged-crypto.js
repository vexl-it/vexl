/* eslint-disable @typescript-eslint/no-var-requires */
// merged-crypto.js
const cryptoBrowserify = require('crypto-browserify')
const reactNativeQuickCrypto = require('@kaladivo/react-native-quick-crypto')

const mergedCrypto = {
  ...cryptoBrowserify,
  ...reactNativeQuickCrypto,
}

module.exports = {default: mergedCrypto, ...mergedCrypto}
