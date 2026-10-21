# Privacy-aware frontend analytics

The business source is the "App Metrics (Draft)" document. These files turn it into what we build.

- `metrics.md`: for business. The decisions we made, the dashboard views, and where each draft metric went.
- `definitions.md`: for engineers. Every signal (journeys, aggregations, backend metrics), its fields and the views it feeds.
- `system.md`: how the system works (transport, storage, client SDK, dashboard rules, privacy analysis).

## Constraints

1. No exact event timestamps leave the device. Day, ISO week or calendar month buckets only. Durations are bucketed on the client.
2. No per-user or per-device id on the server. Every id is scoped to one journey instance or one calendar bucket and expires with it.
3. Analytics is off by default. Users are asked on a consent screen right after the first screen (or once after updating the app) and can change it in settings. No sampling beyond that.
4. Populations are reporting instances (installs with analytics on), never users.
5. Country is the phone number prefix. City is not collected anywhere.
6. Every dashboard group smaller than 20 reporting instances is hidden or merged into "other".

## Collection types

- **journey**: one instance of a flow on one device under a random id. Each upload replaces the state. Lifetime at most 37 days.
- **aggregation**: one row per install per calendar bucket under a random per-bucket id. Unique counts need one aggregation per period, because rows of different buckets cannot be linked.
- **backend**: an existing server metric (`docs/backend_stats.md`). Counts all users, not just reporting instances, and is never mixed with client rows into one ratio.
