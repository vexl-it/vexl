Migrate from ECIES to libsodium cryptobox.

I want to migrate the offer encryption from ECIES to libsodium sealed cryptoboxes.

This is the current encryption overview:
Offer has 2 parts:

- public part (offer info, text, metadata, author private key used for chat...) - this part is encrypted using AES and should not change in this scope
- private part - this part is used to encrypt the offer for each recipient. It is encrypted using ECIES currently which is terribly slow on mobile devices (it takes minutes to encrypt offer for 100+ recipients). With libsodium cryptoboxes this can be done in seconds.

When encrypting offer users fetches target keys of recipients and encrypt them via ECIES. We want to introduce system that allows the userbase to gradually move to libsodium as they update their clients.

This update has 2 stages. In this feature we want to focus on stage 1.

- New clients publishes their cryptobox publickeys together with their old ECIES public keys
- On every resume, new clients reencryt their offers for other clients that published their cryptobox keys
- When creating new offers new clients will prefer encrypting the offer via cryptobox if the recipient updated their public keys (if not they fallback to old ECIES encryption)
- This will gradually replace offers in offer-service database to use the new encryption and more and more users will update their userRecord in userDbSerivce to include publicKeyV2 that is the cryptobox key.

In stage 2 we will completely drop the ECIES support for all clients (but again that is not the scope of this change).

When a client is updated it:

1. generates a new cryptobox keypair and saves that into session storage - this generation is done before anything else happens in the app and while this is happening a loading screen is shown to the user (it will be fast so the loading screen will be shown to the users very briefly). If it fails for some reason the app shows error message and won't let user continue. If we do it this way we can assume we have cryptobox keys generated and later, we don't have to handle cases where libsodium keys can be null

2. On a background user fetches their connections (using `syncConnectionsActionAtom`) and reencryt offers for new connections (as currently implemented) + reencrypt offers for connections that updateed their keys to cryptobox keys.

3. When decrypting offers client will properly use either old ECIES key or the new cryptobox key (based on the offer cypher version which can be obtained as serveroffer.privatePayload.at(0) - offers encrypted with new cryptobox algorythm will set it to 1).

## additional notes

### Encryption Decision Tree (per contact)

```
IF contact.publicKeyV2 exists:
  → Use CryptoBox Seal (privatePayload version '1')
ELSE:
  → Use ECIES Legacy (privatePaylod version '0')
```

### Decryption Logic

```
READ version_byte from encrypted_payload[0]

IF version_byte == '1':
  → Decrypt with CryptoBox Seal Open
  → On failure: HARD ERROR (no fallback)
ELSE IF version_byte == '0':
  → Decrypt with ECIES Legacy
  → On failure: HARD ERROR
```

**No cross-version fallback** - if version byte is '1', only CryptoBox is attempted.

### No Dual Encryption

- Each contact gets ONE encrypted private part (either v1 OR v2)
- Simpler, faster, no fallback complexity

### Owner's Private Part

- Always uses CryptoBox (v2) if owner has v2 keys
- Contains `adminId`, `intendedConnectionLevel`, `intendedClubs`

### This update should include clubs reencryption too

- When reencrypting offers, the user should update it's keys + reencrypt offers prefering cryptobox encryptionc for clubs too.

## What should be changed

- packages/cryptography - to include definitions for new encryption. Carefull since we use `react-native-libsodium` in mobile apps but we have to use libsodium in node `libosidum` package for node.
- packages/resources-utils - to update encryption and decryption offer utils.
- apps/contact-service, packages/rest-api/ - add new database rows, update endpoints to include new cryptobox_key

It is crucial to not break backwards compatibility. The old clients should still be able to use the service and call it without getting errors.

This is an example of how encrypting / decrypting works on mobile

```typescript
await sodium.ready;
const keyPair = sodium.crypto_box_keypair();

console.log("keypair", {
  publicKey: Buffer.from(keyPair.publicKey).toString("base64"),
  privateKey: Buffer.from(keyPair.privateKey).toString("base64"),
});

const encrypted = sodium.crypto_box_seal("hello", keyPair.publicKey);

console.log("Encrypted message:", Buffer.from(encrypted).toString("base64"));

const decrypted = sodium.crypto_box_seal_open(
  encrypted,
  keyPair.publicKey,
  keyPair.privateKey
);

console.log("decrypted message:", Buffer.from(decrypted).toString("utf-8"));
```

What we don't have to handle **out of scope**:

- Client downgrading
- Rollbacks
- Public payload symmetric encryption (AES-GCM) - remains unchanged
- Chat encryption - remains unchanged
- ECDSA signature verification for auth - remains unchanged (secp224r1)
