# Expo token notifier

Send a one-time notification to an exported set of legacy Expo tokens, with local
SQLite bookkeeping. This package is part of the pnpm workspace under `tooling/`.
Only source, tests, and configuration are tracked; runtime files are ignored by
default. The package archive includes only runtime source and package metadata.

## Setup

Use Node 24, matching the repository, or Node 22.18+. SQLite is built into Node;
there is no database server or native dependency to install. Node may print an
experimental SQLite warning.

```sh
pnpm install --frozen-lockfile
cd tooling/expo-token-notifier
pnpm notify --help
```

Existing databases in `local/expo-token-notifier/` can stay there. From this package,
use `--db ../../local/expo-token-notifier/notifications.sqlite` to continue with the
same attempt history. Do not reimport the export into a fresh database to resume
an existing run: that would make all recipients eligible again.

All commands default to `notifications.sqlite` in the current directory. Pass
`--db /absolute/path/notifications.sqlite` to use another location. Its parent
directory must exist. Use the same database for every send and receipt lookup.

## Import once

Export only the `id` and `expo_token` columns from your chosen recipient set, with
headers. IDs are stored as text so large numeric IDs retain their exact value.
These example tokens are synthetic:

```csv
id,expo_token
123,ExponentPushToken[example-one]
456,ExpoPushToken[example-two]
```

```sh
pnpm notify import --csv /path/to/users.csv
pnpm notify status
```

Header order does not matter. Quoted fields, UTF-8 BOM, and CRLF are supported.
Additional columns, duplicate IDs or tokens, empty values, malformed tokens, and
invalid CSV fail the entire import. The transaction rolls back all rows on failure.
An empty or header-only file also fails. Import fails if the recipients table
already contains any rows; reimport never overwrites attempt history.

## Preview and send

```sh
pnpm notify send \
  --title 'Update Vexl' \
  --body 'Please update Vexl to keep receiving notifications.' \
  --chunk-size 100 \
  --dry-run
```

The dry run prints the message and pending/selected counts without modifying the
database or contacting Expo. It needs no access token.

Set `EXPO_ACCESS_TOKEN` in your environment. For an interactive zsh or bash session,
this reads it without echoing it or putting its value in shell history:

```sh
printf 'Expo access token: '
read -rs EXPO_ACCESS_TOKEN
printf '\n'
export EXPO_ACCESS_TOKEN

pnpm notify send \
  --title 'Update Vexl' \
  --body 'Please update Vexl to keep receiving notifications.' \
  --chunk-size 100
```

Each invocation attempts **at most `chunk-size` pending recipients**, then exits.
Run it again to process the next set. Title and body may differ between runs; each
attempt stores its own copy. Notifications use a normal visible title/body payload,
default sound, and high priority. There is no URL or custom navigation data; tapping
opens Vexl through the operating system's normal notification behavior.

The script sends sequential SDK batches of at most 100 tokens, with a one-second
pause between batches. The SDK retains its own HTTP 429 retries inside each call.
There are no application-level send retries.

Before calling Expo, the script commits an attempt marker for just that API batch.
Later runs select only `WHERE attempted_at IS NULL`. Per-recipient errors are saved
and processing continues. A request-level error stops the command, saves the
attempted batch's outcome, and leaves subsequent batches pending.

Ctrl+C, process termination, a network failure, or an ambiguous response can leave
the attempted batch `unknown`. Those rows stay excluded, even if Expo never
received the request. Successful sends can also remain `unknown` if the process
dies before saving their result. This is the agreed tradeoff to avoid script-level
resends. Expo itself does not guarantee exactly-once delivery.

Import, send, and receipts commands acquire an exclusive lock using a separate
`*.lock.sqlite` file. The OS releases the lock when the process exits, including
after a crash. A concurrent command fails immediately. `status` and dry runs can
read while another command is running. Keep these files on a local filesystem and
do not remove or replace the database or lock file during a run.

## Fetch receipts

```sh
pnpm notify receipts
pnpm notify status
```

`receipts` makes one pass through unresolved receipt IDs and exits. It preserves
the original send response and stores receipt status, raw response, and check time
separately. Missing receipts and lookup failures remain eligible for another pass.
Completed `ok` and `error` receipts are skipped. Request-level or malformed receipt
responses fail the command after saving the available failure information.

Expo recommends checking around 15 minutes after sending and clears receipts after
24 hours. `status` reports unresolved receipts older than 24 hours; their delivery
outcome may no longer be recoverable. Receipt `ok` means APNs or FCM accepted the
notification, not that a device displayed it or a user read it.

See [Expo receipt documentation](https://docs.expo.dev/push-notifications/sending-notifications/#check-push-receipts-for-errors)
and [delivery guarantees](https://docs.expo.dev/push-notifications/faq/#delivery-guarantees).

## Inspect or export the results

The `recipients` table contains:

| Columns                                       | Meaning                                                               |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `user_id`, `expo_token`, `imported_at`        | Imported recipient and import time                                    |
| `attempted_at`, `title`, `body`               | Persisted before the SDK send call                                    |
| `send_status`                                 | `pending`, `accepted`, `error`, or `unknown`                          |
| `send_response_json`                          | Original ticket, request failure, or initial uncertainty marker       |
| `receipt_id`                                  | Successful Expo ticket ID used for receipt lookups                    |
| `receipt_status`                              | NULL before lookup, then `missing`, `lookup_failed`, `ok`, or `error` |
| `receipt_response_json`, `receipt_checked_at` | Latest receipt response and lookup time                               |

`accepted` means Expo returned a successful ticket. `error` means a recipient error
or an explicit HTTP 4xx rejection. Network failures, HTTP 5xx responses, malformed
responses, and interrupted attempts are `unknown`. Both `error` and `unknown` stay
excluded from future sends. All timestamps are UTC ISO strings.

Inspect the table with a SQLite browser, or export it using the `sqlite3` CLI:

```sh
sqlite3 -header -csv notifications.sqlite 'SELECT * FROM recipients ORDER BY user_id' > results.csv
```

The CSV, database, and SQLite sidecar files contain recipient data. Files created
by the CLI are restricted to the current OS user. Console output contains counts
and operational errors rather than IDs, tokens, or raw Expo errors. The access
token is never stored; it is redacted from persisted Expo responses. User IDs are
never included in the notification payload. This tool neither connects to Postgres
nor drops the original tokens.

Exit code `1` indicates invalid input, an import/locking/storage failure, or a
request-level failure. Recipient-level send and receipt errors appear in counts
and SQLite; they do not fail the entire command.

## Verification

```sh
pnpm typecheck
pnpm format
pnpm lint
pnpm test
```

From the repository root, run all three checks with
`pnpm exec turbo typecheck format lint --filter=@vexl-next/expo-token-notifier`.
Integration tests run the real CLI, SQLite, and Expo SDK
with an Undici mock transport that disables real network access. They cover import
rollback, chunk limits, response persistence, retry behavior, process termination,
concurrent commands, and receipt lookups. They do not send real notifications.

Actual display and tap behavior on the targeted old iOS and Android builds still
needs a device check. Use a separate CSV and database containing your own test
device tokens for that check before processing the real export.
