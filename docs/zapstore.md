# Publishing to Zapstore

Run **[Release] Zapstore** from the `main` branch in GitHub Actions to publish the
latest stable GitHub release containing a production APK. Dispatches from other
branches or tags skip the publishing job. The publisher selects assets matching
`vexl-production-*.apk` and uses the metadata in `apps/mobile/zapstore.yaml`.
Drafts and prereleases are excluded.

The workflow signs the Zapstore events with the Nostr private key in the `NSEC`
repository secret. Use an `nsec1...` or 64-character hex private key belonging to
Vexl's Zapstore publisher identity. This signs the listing and release events;
the APK keeps its existing Android signature.

The workflow runs manually, serializes publishes, and requires only read access
to GitHub contents. Uploads and signed events go to Zapstore's default CDN and
relay. The pinned `zsp` binary is checked against its SHA-256 digest before use.

To check release discovery and APK parsing locally without publishing, install
[zsp](https://github.com/zapstore/zsp) and run:

```sh
zsp publish --check apps/mobile/zapstore.yaml
```
