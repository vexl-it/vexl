import {Schema} from 'effect'

// Only channels published by CI previews are accepted — `pr-<number>`
// (pr-preview.yaml) and `main` (main-preview.yaml). A QR code must never be
// able to point an install at `production` or any other channel.
export const PreviewChannel = Schema.String.pipe(
  Schema.pattern(/^(pr-\d+|main)$/),
  Schema.brand('PreviewChannel')
)
export type PreviewChannel = typeof PreviewChannel.Type

export const MAIN_PREVIEW_CHANNEL = Schema.decodeSync(PreviewChannel)('main')

export class PreviewError extends Schema.TaggedError<PreviewError>(
  'PreviewError'
)('PreviewError', {
  cause: Schema.Unknown,
  reason: Schema.Literal(
    // prod build, or updates disabled (dev build running from Metro)
    'notAvailableInThisBuild',
    // setUpdateRequestHeadersOverride threw
    'headerOverrideRejected',
    // fetchUpdateAsync rejected (offline, or the PR channel was deleted)
    'fetchFailed',
    // fetch succeeded but found nothing new (runtime fingerprint mismatch)
    'updateNotFound',
    'reloadFailed'
  ),
}) {}
