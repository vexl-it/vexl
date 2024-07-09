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
