# Account deletion website

The purpose of this website is to allow user to remove their account from the web as per [Google Play Store requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en). Deleting account using this website won't delete user's offers, since they are not connected to the phone number. The keys to remove the offers are stored only at user's device and there is no other way how to authorize author of the offer...

This website can be accessed on https://app.vexl.it.

## How to run

```sh
yarn
yarn workspace account-deletion-website dev
```

## How to build

```sh
yarn workspace account-deletion-website build
```

`BE_ENV` is resolved at runtime by the Next.js server and defaults to `stage` unless `BE_ENV=prod` is set.

Turnstile protection for SMS initiation uses:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `account-deletion-website`
- `TURNSTILE_SECRET_KEY` in `user-service`
- optional `TURNSTILE_EXPECTED_HOSTNAME` in `user-service` for hostname pinning
