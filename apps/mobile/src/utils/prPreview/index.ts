import {Effect, Either, Schema} from 'effect'
import * as Updates from 'expo-updates'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {showErrorAlert} from '../../components/ErrorAlert'
import {globalDialogAtom} from '../../components/GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../components/LoadingOverlayProvider'
import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'
import {enableHiddenFeatures} from '../environment'
import {reportErrorE} from '../reportError'
import {PreviewChannel, PreviewError} from './domain'

// Loads preview bundles (published by pr-preview.yaml / main-preview.yaml as
// EAS Updates on channels "pr-<number>" / "main") into the staging release
// build by overriding the expo-channel-name request header at runtime. The
// override is persisted natively across restarts, so the app keeps following
// the preview channel until it is cleared from the debug screen.
//
// All strings here are intentionally hardcoded English: every path that can
// render them is limited to staging builds (same policy as DebugScreen).

// expo-updates has no getter for the active header override (Updates.channel
// reflects it only after a reload), so the app tracks the active preview
// channel itself for display and clearing.
export const previewChannelStorageAtom = atomWithParsedMmkvStorage(
  'previewChannel',
  {activeChannel: null},
  Schema.Struct({activeChannel: Schema.NullOr(PreviewChannel)}),
  'deviceLocal'
)

// Prod builds must never switch channels; dev builds running from Metro have
// expo-updates disabled entirely.
const isPreviewSupported = Boolean(enableHiddenFeatures && Updates.isEnabled)

const overrideUpdateChannel = (
  channel: PreviewChannel | null
): Effect.Effect<void, PreviewError> =>
  Effect.try({
    try: () => {
      Updates.setUpdateRequestHeadersOverride(
        channel !== null ? {'expo-channel-name': channel} : null
      )
    },
    catch: (e) =>
      new PreviewError({cause: e, reason: 'headerOverrideRejected'}),
  })

const fetchUpdate = Effect.tryPromise({
  try: async () => await Updates.fetchUpdateAsync(),
  catch: (e) => new PreviewError({cause: e, reason: 'fetchFailed'}),
})

const reloadApp = Effect.tryPromise({
  try: async () => {
    await Updates.reloadAsync()
  },
  catch: (e) => new PreviewError({cause: e, reason: 'reloadFailed'}),
})

export const loadPreviewChannelActionAtom = atom(
  null,
  (get, set, channel: PreviewChannel): Effect.Effect<void, PreviewError> =>
    Effect.gen(function* (_) {
      if (!isPreviewSupported)
        return yield* _(
          new PreviewError({
            cause: undefined,
            reason: 'notAvailableInThisBuild',
          })
        )

      const previousChannel = get(previewChannelStorageAtom).activeChannel
      const restorePreviousOverride = overrideUpdateChannel(
        previousChannel
      ).pipe(Effect.ignore)

      yield* _(overrideUpdateChannel(channel))

      const result = yield* _(
        fetchUpdate,
        Effect.tapError(() => restorePreviousOverride)
      )

      if (!result.isNew) {
        // Loading the channel that is already running — nothing new to
        // download is fine, not an error.
        if (previousChannel === channel) return

        yield* _(restorePreviousOverride)
        return yield* _(
          new PreviewError({cause: undefined, reason: 'updateNotFound'})
        )
      }

      set(previewChannelStorageAtom, {activeChannel: channel})
      yield* _(reloadApp)
    })
)

export const loadPreviewChannelWithUiFeedbackActionAtom = atom(
  null,
  (get, set, channel: PreviewChannel): Effect.Effect<void, PreviewError> =>
    Effect.gen(function* (_) {
      if (!isPreviewSupported)
        // Fail without UI: a prod build scanning/tapping a preview link
        // should do nothing.
        return yield* _(
          new PreviewError({
            cause: undefined,
            reason: 'notAvailableInThisBuild',
          })
        )

      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: 'Load preview bundle?',
          subtitle: `Downloads the JS bundle from update channel "${channel}" and restarts the app. To return to the staging channel, open the debug screen and tap "Clear preview".`,
          negativeButtonText: 'Cancel',
          positiveButtonText: 'Load & restart',
        })
      )
      if (!confirmed) return

      set(loadingOverlayDisplayedAtom, true)
      yield* _(set(loadPreviewChannelActionAtom, channel))
    }).pipe(
      Effect.ensuring(
        // The success path reloads the app, but every failure path must
        // clean the overlay up.
        Effect.sync(() => {
          set(loadingOverlayDisplayedAtom, false)
        })
      ),
      Effect.tapError((e) => {
        if (e.reason === 'notAvailableInThisBuild') return Effect.void

        if (e.reason === 'updateNotFound') {
          Alert.alert(
            'No compatible update found',
            `Channel "${channel}" has no update matching this build's runtime. If the change includes native code, a new staging build is needed first. A PR channel may also be deleted already (PR closed).`
          )
          return Effect.void
        }

        showErrorAlert({title: 'Failed to load preview bundle', error: e})
        return reportErrorE(
          'warn',
          new Error('Failed to load preview bundle'),
          {
            e,
          }
        )
      })
    )
)

export const clearPreviewChannelActionAtom = atom(
  null,
  (get, set): Effect.Effect<void, PreviewError> =>
    Effect.gen(function* (_) {
      set(loadingOverlayDisplayedAtom, true)

      yield* _(overrideUpdateChannel(null))
      set(previewChannelStorageAtom, {activeChannel: null})

      // Not cosmetic: fetching refreshes the local update database against
      // the staging channel so the launcher stops selecting the previously
      // downloaded preview bundle on the next start.
      const fetchResult = yield* _(fetchUpdate, Effect.either)
      if (Either.isLeft(fetchResult)) {
        Alert.alert(
          'Update server not reachable',
          'The channel override was cleared, but the preview bundle may keep running until the app can fetch the staging channel again.'
        )
      }

      yield* _(reloadApp)
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          set(loadingOverlayDisplayedAtom, false)
        })
      ),
      Effect.tapError((e) =>
        Effect.sync(() => {
          showErrorAlert({title: 'Failed to clear preview', error: e})
        })
      )
    )
)
