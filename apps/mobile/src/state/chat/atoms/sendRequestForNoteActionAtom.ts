import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {sendMessagingRequest} from '@vexl-next/resources-utils/src/chat/sendMessagingRequest'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {withLoadingOverlayAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {goldenAvatarTypeAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {generateAndRegisterVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {upsertInboxOnBeAndLocallyActionAtom} from '../hooks/useCreateInbox'
import {version} from './../../../utils/environment'
import upsertChatForTheirNoteActionAtom from './upsertChatForTheirNoteActionAtom'

const sendRequestForNoteActionAtom = atom(
  null,
  (get, set, {text, note}: {text: string; note: OneNoteInState}) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom)
      const goldenAvatarType = get(goldenAvatarTypeAtom)

      const {inbox} = yield* _(
        set(upsertInboxOnBeAndLocallyActionAtom, {
          for: 'noteRequest',
          noteId: note.noteInfo.noteId,
        })
      )
      const notificationToken = yield* _(
        set(generateAndRegisterVexlTokenActionAtom, {
          keyHolder: inbox.privateKey,
        })
      )

      const sentMessage = yield* _(
        sendMessagingRequest({
          text,
          notificationApi: api.notification,
          theirNotificationCypher:
            note.noteInfo.publicPart.vexlNotificationToken,
          api: api.chat,
          fromKeypair: inbox.privateKey,
          myVersion: version,
          toPublicKey: note.noteInfo.publicPart.notePublicKey,
          otherSideVersion: note.noteInfo.publicPart.authorClientVersion,
          myNotificationCypher: notificationToken,
          lastReceivedNotificationCypher:
            note.noteInfo.publicPart.vexlNotificationToken,
          goldenAvatarType,
          forClubsUuids: [],
          commonFriends: note.noteInfo.privatePart.commonFriends,
          verifiedCommonFriends: [],
          friendLevel: note.noteInfo.privatePart.friendLevel,
        })
      )

      return set(upsertChatForTheirNoteActionAtom, {
        inbox: {privateKey: inbox.privateKey},
        initialMessage: {
          state: 'sent',
          message: sentMessage.message,
          receivedByServerAt: sentMessage.receivedByServerAt,
        },
        sentVexlNotificationToken: notificationToken,
        note,
      })
    })
)

export const sendRequestForNoteHandleUIActionAtom = atom(
  null,
  (get, set, {text, note}: {text: string; note: OneNoteInState}) =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)
      yield* _(set(checkNotificationPermissionsAndAskIfPossibleActionAtom))

      return yield* _(
        set(sendRequestForNoteActionAtom, {text, note}),
        Effect.tapError((e) =>
          Effect.sync(() => {
            if (e._tag === 'ApiErrorCreatingInbox') {
              reportError(
                'error',
                new Error('Error recreating user inbox after it was deleted'),
                {e}
              )

              showErrorAlert({
                title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
                error: e,
              })
            }
          })
        ),
        set(withLoadingOverlayAtom)
      )
    })
)

export default sendRequestForNoteActionAtom
