/** @type {import('@expo/fingerprint').Config} */
const config = {
  ignorePaths: [
    // eas.json is hashed as a fingerprint source by default, but edits to
    // build profiles alone never change the native app — hashing it would
    // rotate the runtime version for no reason. Settings in eas.json that
    // really affect the native app (env like ENV_PRESET) still show up in
    // the fingerprint through the evaluated expo config.
    'eas.json',
    // react-native-libsodium's postinstall extracts libsodium/build.tgz,
    // an archive created on macOS that carries AppleDouble metadata. GNU
    // tar on Linux (CI runners publishing updates) materializes it as
    // literal `._*` files while bsdtar on macOS (EAS build workers) turns
    // it into invisible xattrs, so the extracted tree hashes differently
    // per OS and runtime versions never match. The extracted output is
    // fully derived from build.tgz, which is still fingerprinted, so
    // ignoring it loses nothing.
    '**/node_modules/react-native-libsodium/libsodium/build/**',
    // ...and the AppleDouble entry for the build dir itself, which GNU tar
    // materializes as a literal file next to it.
    '**/node_modules/react-native-libsodium/**/._*',
  ],
  sourceSkips: [
    // `extra` carries commitHash (EAS_BUILD_GIT_COMMIT_HASH), which differs
    // on every build and is unset entirely when publishing updates from CI.
    // Hashing it would make every fingerprint unique, so no update would
    // ever be compatible with any build.
    'ExpoConfigExtraSection',
    // Version bumps alone do not change native code and should not rotate
    // the runtime version.
    'ExpoConfigVersions',
  ],
}

module.exports = config
