# Analytics OHTTP relay

The relay that keeps client IPs away from Vexl's analytics endpoint. The app
encrypts each analytics upload to the metrics-service gateway key and posts it
here; the relay forwards the opaque body to the gateway with every client header
removed. The relay sees who sends, not what; the gateway sees what, not who.
The guarantee holds only if the relay is run by someone other than Vexl. See
`docs/analytics/system.md`, section 4.5.

## Run it

Any host with Caddy 2.x:

```sh
RELAY_SITE=relay.example.org \
GATEWAY_UPSTREAM=https://metrics.vexl.it \
RELAY_TOKEN=<token agreed with Vexl> \
caddy run --config Caddyfile
```

Caddy obtains the TLS certificate itself. Do not put the relay behind a
service that logs client IPs (for example a CDN Vexl also uses).

## Operator commitments

- Keep access logging off (the Caddyfile writes none) and do not add request
  logging in front of it.
- Do not change the header handling: the relay must forward no client header.
- Keep `RELAY_TOKEN` secret; it only identifies the relay to the gateway.

## Local dev

`pnpm dev:backend` starts it as the `ohttp-relay` compose service on port 3017,
forwarding to the metrics-service on the host. `pnpm dev:mobile` points the app
at it.
