# Vexl

![vexl](vexl.jpg)

Vexl is a mobile app giving its users a simple, accessible and safe way to trade bitcoin as it was intended - peer-to-peer and without KYC.

<a href="https://www.youtube.com/watch?v=7RbfJZloriQ"><img src="https://img.youtube.com/vi/7RbfJZloriQ/maxresdefault.jpg" width="640"></a>

## How to build and run the mobile app

The app lives in `apps/mobile` directory. All following instructions should be ran in that repository.

To run the app, you need to setup env file. Create `.env` file with following content (make sure to provide google maps api keys as described [here](https://developers.google.com/maps/documentation/javascript/get-api-key)):

```
ANDROID_MAP_API_KEY=
IOS_MAP_API_KEY=
SENTRY_DISABLE_AUTO_UPLOAD=true
ENV_PRESET=prod
```

To run the app in dev mode run following commands

```
yarn
yarn expo prebuild --clean
yarn expo run:ios  ## for ios
yarn expo run:android ## for android
```

## Help us translate the app

See [this guide](docs/how_to_help_transalte.md) for details.

## Other

This project is tested with BrowserStack.

## APK Signature Verification

For Android, you can download the app from the [Google Play Store](https://play.google.com/store/apps/details?id=your.package.id) or use the APK files provided in the [Releases](https://github.com/your-org/your-repo/releases) section.

If you choose to install the APK manually, we recommend verifying its signature to ensure its authenticity. Vexl signs the APK with the following certificate fingerprints:

```
SHA-256: 84a7fbcd54a4ca60e52b25311862ce4715d50a62c203760dbcb91aefe8eb20d4
SHA-1:   57af35233b2b9474ae6e0e2a6d80da629d9c0571
MD5:     4f4f27bb2faacc7a9426dd15d903a9a1
```

### How to verify the APK

1. Download the APK file.

2. Run the following command to print its signing certificate fingerprints:

   ```bash
   apksigner verify --print-certs your-apk-file.apk
   ```

3. Confirm that the fingerprints match the values listed above.

If the fingerprints do not match, **do not install the APK** and contact us to report the issue.

### Automatic Updates via Obtainium (Recommended)

For users who prefer to install the APK directly (outside of Google Play), we recommend using [Obtainium](https://github.com/ImranR98/Obtainium).

Obtainium can automatically download and update the latest APK releases directly from our official GitHub releases, ensuring you always receive updates from the trusted source.

- ✅ Automatic update checks
- ✅ Downloads directly from GitHub Releases
- ✅ Preserves your app signature for verification

Simply add our GitHub repository to Obtainium to stay up to date.

---
