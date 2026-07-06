/** @type {import('@expo/fingerprint').Config} */
const config = {
  ignorePaths: [
    // eas.json is hashed as a fingerprint source by default, but
    // build-eas-dev-client.yaml injects a unique IOS_BUILD_NUMBER_SUFFIX
    // into it on every run — hashing it would give every dev-client build
    // a runtime version no update can ever match. Settings in eas.json
    // that really affect the native app (env like ENV_PRESET) still show
    // up in the fingerprint through the evaluated expo config.
    'eas.json',
  ],
  sourceSkips: [
    // `extra` carries commitHash (EAS_BUILD_GIT_COMMIT_HASH), which differs
    // on every build and is unset entirely when publishing updates from CI.
    // Hashing it would make every fingerprint unique, so no update would
    // ever be compatible with any build.
    'ExpoConfigExtraSection',
    // Version bumps alone do not change native code, and dev-client builds
    // inject a unique ios.buildNumber suffix (see build-eas-dev-client.yaml).
    // Neither should rotate the runtime version.
    'ExpoConfigVersions',
  ],
}

module.exports = config
