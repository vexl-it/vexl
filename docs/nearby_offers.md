# Nearby offers (Bluetooth broadcast)

Lets a user share one of their offers with anyone physically nearby, not only
with their contact network. The phone advertises a small secret over Bluetooth
Low Energy; nearby phones pick it up, fetch the offer from the server and show
it in the marketplace. Chat still goes through the normal server path.

Hidden behind the `nearbyOffersEnabled` developer preference.

## Model

No server changes. Everything reuses the club offer machinery:

- When the owner enables nearby sharing on an offer, the app generates a fresh
  secp256k1 key pair for that offer (the **nearby key pair**) and uploads one
  extra private part addressed to its public key via `createPrivatePart`
  (admin ID authenticated). That private part is a normal `OfferPrivatePart`:
  `{commonFriends: [], verifiedCommonFriends: [], friendLevel: ['NEARBY'], symmetricKey, clubIds: []}`
  encrypted with ECIES V1 to the nearby public key (PEM).
- The BLE payload is the nearby **private key**, as its raw 32-byte secp256k1
  scalar. In JS it travels as a base64 string branded `NearbyOfferKey`.
- A receiver rebuilds the key pair from the raw scalar (`privateRawToPem` +
  `importKeyPair` in `@vexl-next/cryptography`), signs a challenge with it and
  calls the existing `getClubOffersForMeModifiedOrCreatedAfterPaginated`
  endpoint, which returns exactly one offer. It is decrypted with the normal
  `decryptOffer` path. The request carries no user security headers, only the
  common headers and the client IP, the same exposure as a club offer fetch.
- Disabling sharing calls `deletePrivatePart` with the nearby public key. The
  offer stays up for the contact network. Receivers prune it on their next
  refresh through `getRemovedClubOffers` signed with the nearby key.
- Re-enabling generates a **new** key pair, so stale keys cannot re-fetch.
- Editing an offer (`updateOffer`) must keep the nearby private part: the
  owner side re-encrypts the private part for the nearby public key whenever
  `ownershipInfo.nearbyKey` is set.

Why the private key and not the symmetric key: the challenge flow needs a V1
signature, the raw scalar is only 32 bytes, and it gives the receiver a way to
fetch, refresh, prune and report the offer without any new endpoint.

## Domain additions (`packages/domain`, `packages/resources-utils`)

- `FriendLevel` gains the literal `'NEARBY'`.
- `NearbyOfferKey`: branded base64 string of the raw 32-byte private key.
- `OwnershipInfo.nearbyKey?: NearbyOfferKey` (owner side; present while
  sharing is on).
- `packages/resources-utils/src/offers/nearby/`:
  - `nearbyKeyToKeyPair(key: NearbyOfferKey): PrivateKeyHolder`
  - `generateNearbyKey(): NearbyOfferKey`
  - `enableNearbySharing({offerApi, adminId, symmetricKey})` returns the new
    key after uploading the private part.
  - `disableNearbySharing({offerApi, adminId, nearbyKey})` deletes the part.
  - `fetchNearbyOffer({offerApi, nearbyKey})` returns the decrypted
    `OfferInfo` or a typed error. Validates `friendLevel` is exactly
    `['NEARBY']`, `clubIds` empty, `commonFriends` empty.
  - `getRemovedNearbyOffers({offerApi, keysByOfferId})` returns the offer IDs
    whose nearby private part no longer exists.

## Mobile state (`apps/mobile`)

- Preferences: `nearbyOffersEnabled` (dev screen feature flag) and
  `nearbyOffersReceivingEnabled` (user toggle in Account settings, shown only
  when the flag is on).
- `nearbyOffersStateAtom` (MMKV): `Record<OfferId, {key: NearbyOfferKey, lastSeenAt}>`
  for received offers. The decrypted offers live in the normal
  `offersStateAtom` with `friendLevel: ['NEARBY']`, shown with `Nearby` in
  place of the friend level. They are never filtered out by the friend level
  or source filters. An offer that also comes from contacts or a club keeps its
  friend level label and gets a `Nearby` tag next to it on the card and in the
  offer detail, where a note says it is also shared over Bluetooth.
- Advertising: whenever the feature flag is on, the module advertises the
  nearby keys of all my offers with `ownershipInfo.nearbyKey` set. Empty list
  stops advertising.
- Receiving: when the flag and the receiving toggle are on, the module scans.
  Each discovered key that is not yet stored (and is not one of mine) is
  fetched and stored. If the app is not in the foreground a local notification
  "New offer nearby" is shown via `displayLocalNotification` for every such
  batch, even when the offer is already known from contacts or clubs, and
  tapping it opens the offer. The stored offer keeps all its sources, so its
  `friendLevel` can be e.g. `['FIRST_DEGREE', 'NEARBY']`.
- Refresh: the normal offers refresh also re-fetches each known nearby key and
  prunes removed ones.

## Native module (`apps/mobile/modules/vexl-nearby-ble`)

Local Expo module. Android is the primary target. iOS is best effort with
CoreBluetooth and the same JS API.
Android 12+ is required: below it `requestPermissions` resolves `false`.

```ts
setAdvertisedKeys(keysBase64: string[]): Promise<void> // [] stops advertising
startScanning(): Promise<void>
stopScanning(): Promise<void>
requestPermissions(): Promise<boolean>
addListener('onNearbyKeysDiscovered', ({keys}: {keys: string[]}) => void)
```

Wire format:

- Service UUID `b7e1c0de-5e7a-4c3e-9a1f-0f4d3c2b1a01` in the advertisement.
- One read characteristic `b7e1c0de-5e7a-4c3e-9a1f-0f4d3c2b1a02` on a GATT
  server whose value is the concatenation of the raw 32-byte keys.
- A scanner that sees the service UUID connects, reads the characteristic,
  splits it into 32-byte chunks, disconnects and emits the keys as base64.
  The same device address is not re-read more often than every 2 minutes.

Android: `BluetoothLeAdvertiser` + `BluetoothGattServer` for the peripheral
side, `BluetoothLeScanner` with a service UUID filter for the central side.
Both run inside a foreground service (`connectedDevice` type) so they keep
working while the app is in the background. Permissions
`BLUETOOTH_SCAN` (neverForLocation), `BLUETOOTH_ADVERTISE`,
`BLUETOOTH_CONNECT`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CONNECTED_DEVICE`
are declared by the module's config plugin.

## Privacy notes

- Sharing is opt-in per offer. While on, the phone is a trackable beacon and
  anyone nearby, including non-Vexl users, can read the full offer. The UI
  says so when enabling.
- The fetch path is unauthenticated apart from the challenge. The server sees
  the same common headers and IP as for club fetches, so it could in theory
  correlate a nearby fetch with other traffic from the same device. It never
  gets an explicit user identity for the fetch.
