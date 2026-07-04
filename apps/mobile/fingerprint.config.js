/** @type {import('@expo/fingerprint').Config} */
const config = {
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
