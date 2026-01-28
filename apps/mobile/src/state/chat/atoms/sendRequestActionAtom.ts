import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {sendMessagingRequest} from '@vexl-next/resources-utils/src/chat/sendMessagingRequest'
import {Array, Effect, Record} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {withLoadingOverlayAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {goldenAvatarTypeAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {clubsToKeyHolderAtom} from '../../clubs/atom/clubsToKeyHolderAtom'
import {generateAndRegisterVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {upsertInboxOnBeAndLocallyActionAtom} from '../hooks/useCreateInbox'
import {version} from './../../../utils/environment'
import upsertChatForTheirOfferActionAtom from './upsertChatForTheirOfferActionAtom'

const sendRequestActionAtom = atom(
  null,
  (
    get,
    set,
    {text, originOffer}: {text: string; originOffer: OneOfferInState}
  ) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom)
      const goldenAvatarType = get(goldenAvatarTypeAtom)
      const clubsToKeyHolder = get(clubsToKeyHolderAtom)
      const forClubsUuids = pipe(
        Record.keys(clubsToKeyHolder),
        Array.filter((clubUuid) =>
          Array.contains(clubUuid)(originOffer.offerInfo.privatePart.clubIds)
        )
      )

      const {inbox} = yield* _(
        set(upsertInboxOnBeAndLocallyActionAtom, {
          for: 'offerRequest',
          offerId: originOffer.offerInfo.offerId,
        })
      )
      const notificationToken = yield* _(
        set(generateAndRegisterVexlTokenActionAtom, {
          keyHolder: inbox.privateKey,
        })
      )
      const message = yield* _(
        sendMessagingRequest({
          text,
          notificationApi: api.notification,
          theirNotificationCypher: originOffer.offerInfo.publicPart.fcmCypher,
          api: api.chat,
          fromKeypair: inbox.privateKey,
          myVersion: version,
          toPublicKey: originOffer.offerInfo.publicPart.offerPublicKey,
          otherSideVersion:
            originOffer.offerInfo.publicPart.authorClientVersion,
          myNotificationCypher: notificationToken,
          lastReceivedNotificationCypher:
            originOffer.offerInfo.publicPart.fcmCypher,
          goldenAvatarType,
          forClubsUuids,
          commonFriends: originOffer.offerInfo.privatePart.commonFriends,
          friendLevel: originOffer.offerInfo.privatePart.friendLevel,
        })
      )

      return set(upsertChatForTheirOfferActionAtom, {
        inbox: {privateKey: inbox.privateKey},
        initialMessage: {state: 'sent', message},
        sentVexlNotificationToken: notificationToken,
        offer: originOffer,
      })
    })
)

export const sendRequestHandleUIActionAtom = atom(
  null,
  (
    get,
    set,
    {text, originOffer}: {text: string; originOffer: OneOfferInState}
  ) =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)
      yield* _(set(checkNotificationPermissionsAndAskIfPossibleActionAtom))

      return yield* _(
        set(sendRequestActionAtom, {text, originOffer}),
        // TODO handle errors
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

export default sendRequestActionAtom
