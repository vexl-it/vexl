import {Schema} from 'effect'

// Only channels published by CI previews are accepted — `pr-<number>`
// (pr-preview.yaml) and `main` (main-preview.yaml). A QR code must never be
// able to point an install at `production` or any other channel.
export const PreviewChannel = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^(pr-\d+|main)$/)),
  Schema.brand('PreviewChannel')
)
export type PreviewChannel = typeof PreviewChannel.Type

export const MAIN_PREVIEW_CHANNEL = Schema.decodeSync(PreviewChannel)('main')

export class PreviewError extends Schema.TaggedError<PreviewError>(
  'PreviewError'
)('PreviewError', {
  cause: Schema.Unknown,
  reason: Schema.Literals([
    'notAvailableInThisBuild',
    'headerOverrideRejected',
    'fetchFailed',
    'updateNotFound',
    'reloadFailed',
  ]),
}) {}
