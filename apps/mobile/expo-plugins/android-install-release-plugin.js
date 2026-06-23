const {withAppBuildGradle} = require('expo/config-plugins')

const MARKER_START = '// @generated begin vexl-install-release'
const MARKER_END = '// @generated end vexl-install-release'

const INSTALL_RELEASE_GRADLE = `${MARKER_START}
def vexlAndroidSdkDir = {
    def sdkDir = System.getenv("ANDROID_HOME") ?: System.getenv("ANDROID_SDK_ROOT")
    if (sdkDir != null && sdkDir.trim()) {
        return file(sdkDir)
    }

    def localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        def localProperties = new Properties()
        localPropertiesFile.withInputStream { stream ->
            localProperties.load(stream)
        }

        sdkDir = localProperties.getProperty("sdk.dir")
        if (sdkDir != null && sdkDir.trim()) {
            return file(sdkDir)
        }
    }

    throw new GradleException("Could not find Android SDK. Set ANDROID_HOME, ANDROID_SDK_ROOT, or sdk.dir in android/local.properties.")
}

def vexlExecutableCandidates = { File base ->
    def suffixes = System.getProperty("os.name").toLowerCase().contains("windows") ? ["", ".bat", ".exe"] : [""]
    return suffixes.collect { suffix -> new File(base.parentFile, base.name + suffix) }
}

def vexlResolveExistingExecutable = { File base ->
    def executable = vexlExecutableCandidates(base).find { it.exists() }
    if (executable == null) {
        throw new GradleException("Could not find executable " + base.absolutePath)
    }

    return executable
}

def vexlResolveAndroidBuildTool = { String toolName ->
    def sdkDir = vexlAndroidSdkDir()
    def candidates = []

    if (rootProject.ext.has("buildToolsVersion")) {
        candidates << new File(new File(sdkDir, "build-tools/" + rootProject.ext.buildToolsVersion), toolName)
    }

    def buildToolsDir = new File(sdkDir, "build-tools")
    if (buildToolsDir.exists()) {
        def buildToolVersions = buildToolsDir.listFiles()?.findAll { it.isDirectory() } ?: []
        buildToolVersions.sort { a, b -> b.name <=> a.name }.each { versionDir ->
            candidates << new File(versionDir, toolName)
        }
    }

    def executable = candidates.collect { candidate -> vexlExecutableCandidates(candidate) }.flatten().find { it.exists() }
    if (executable == null) {
        throw new GradleException("Could not find Android build tool " + toolName + " under " + buildToolsDir.absolutePath)
    }

    return executable
}

def vexlRunCommand = { List command ->
    def process = new ProcessBuilder(command.collect { item -> item.toString() }).inheritIO().start()
    def exitCode = process.waitFor()

    if (exitCode != 0) {
        throw new GradleException("Command failed with exit code " + exitCode + ": " + command.join(" "))
    }
}

afterEvaluate {
    if (tasks.findByName("installRelease") == null) {
        tasks.register("installRelease") {
            group = "install"
            description = "Signs the release APK with the debug key and installs it on a connected Android device."

            dependsOn("assembleRelease")

            doLast {
                def outputDir = layout.buildDirectory.dir("outputs/apk/release").get().asFile
                def releaseApk = new File(outputDir, "app-release.apk")
                def unsignedReleaseApk = new File(outputDir, "app-release-unsigned.apk")
                def apkToInstall = releaseApk.exists() ? releaseApk : unsignedReleaseApk

                if (!apkToInstall.exists()) {
                    throw new GradleException("Could not find release APK in " + outputDir.absolutePath)
                }

                if (!releaseApk.exists()) {
                    def debugKeystore = file("debug.keystore")
                    if (!debugKeystore.exists()) {
                        throw new GradleException("Cannot sign release APK for local install because " + debugKeystore.absolutePath + " does not exist.")
                    }

                    def installDir = layout.buildDirectory.dir("intermediates/vexlInstallRelease").get().asFile
                    installDir.mkdirs()

                    def alignedApk = new File(installDir, "app-release-debug-aligned.apk")
                    def signedApk = new File(installDir, "app-release-debug-signed.apk")

                    vexlRunCommand([vexlResolveAndroidBuildTool("zipalign").absolutePath, "-p", "-f", "4", unsignedReleaseApk.absolutePath, alignedApk.absolutePath])
                    vexlRunCommand([vexlResolveAndroidBuildTool("apksigner").absolutePath, "sign", "--ks", debugKeystore.absolutePath, "--ks-pass", "pass:android", "--key-pass", "pass:android", "--ks-key-alias", "androiddebugkey", "--out", signedApk.absolutePath, alignedApk.absolutePath])

                    apkToInstall = signedApk
                }

                def adbArguments = []
                def androidSerial = System.getenv("ANDROID_SERIAL")
                if (androidSerial != null && androidSerial.trim()) {
                    adbArguments.addAll(["-s", androidSerial.trim()])
                }

                adbArguments.addAll(["install", "-r", "-d"])

                def expoAdbUser = System.getenv("EXPO_ADB_USER")
                if (expoAdbUser != null && expoAdbUser.trim()) {
                    adbArguments.addAll(["--user", expoAdbUser.trim()])
                }

                adbArguments << apkToInstall.absolutePath

                println "Installing " + apkToInstall.absolutePath
                vexlRunCommand([vexlResolveExistingExecutable(new File(vexlAndroidSdkDir(), "platform-tools/adb")).absolutePath] + adbArguments)
            }
        }
    }
}
${MARKER_END}`

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function addInstallReleaseTask(contents) {
  const generatedBlock = new RegExp(
    `${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}\\n*`,
    'm'
  )

  return `${contents.replace(generatedBlock, '').trimEnd()}\n\n${INSTALL_RELEASE_GRADLE}\n`
}

module.exports = function withAndroidInstallRelease(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = addInstallReleaseTask(
      config.modResults.contents
    )
    return config
  })
}
