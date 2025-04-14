import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import decryptOffer from '@vexl-next/resources-utils/src/offers/decryptOffer'
import encryptOfferPublicPayload from '@vexl-next/resources-utils/src/offers/utils/encryptOfferPublicPayload'
import {Array, Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {showGoldenAvatarAnimationAtom} from '../../components/GoldenAvatar'
import {loadingOverlayDisplayedAtom} from '../../components/LoadingOverlayProvider'
import {myOffersAtom} from '../../state/marketplace/atoms/myOffers'
import {sessionDataOrDummyAtom} from '../../state/session'
import {translationAtom} from '../localization/I18nProvider'
import {goldenAvatarTypeAtom} from '../preferences'
import reportError from '../reportError'
import showErrorAlert from '../showErrorAlert'

export const handleGoldenGlassesDeepLinkActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const {offer} = get(apiAtom)
  const session = get(sessionDataOrDummyAtom)
  const myOffers = get(myOffersAtom)

  set(loadingOverlayDisplayedAtom, true)

  return pipe(
    Array.map(myOffers, (one) =>
      pipe(
        encryptOfferPublicPayload({
          offerPublicPart: {
            ...one.offerInfo.publicPart,
            goldenAvatarType: 'BACKGROUND_AND_GLASSES',
          },
          symmetricKey: one.offerInfo.privatePart.symmetricKey,
        }),
        Effect.flatMap((encryptedPayload) =>
          pipe(
            offer.updateOffer({
              body: {
                adminId:
                  one.offerInfo.privatePart.adminId ?? ('' as OfferAdminId),
                payloadPublic: encryptedPayload,
                offerPrivateList: [],
              },
            }),
            Effect.flatMap((encryptedPayload) =>
              decryptOffer(session.privateKey)(encryptedPayload)
            )
          )
        ),
        Effect.map((offerInfo) => ({
          ...one,
          offerInfo,
        }))
      )
    ),
    Effect.all,
    Effect.match({
      onSuccess(updatedOffers) {
        set(myOffersAtom, updatedOffers)
        set(goldenAvatarTypeAtom, 'BACKGROUND_AND_GLASSES')
        set(loadingOverlayDisplayedAtom, false)
        set(showGoldenAvatarAnimationAtom, true)
      },
      onFailure(e) {
        showErrorAlert({
          title: t('goldenGlasses.errorSettingRewardForParticipationOnMeetup'),
          error: e,
        })

        reportError(
          'error',
          new Error(
            'Error while setting golden glasses avatar for meetup participation. One or more offers were not updated.'
          ),
          {e}
        )
      },
    })
  )
})
