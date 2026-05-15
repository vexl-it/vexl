import {Array, Effect, pipe, Record, Schema} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {Alert} from 'react-native'
import {apiAtom} from '../../../../api'
import {showErrorAlert} from '../../../../components/ErrorAlert'
import {globalDialogAtom} from '../../../../components/GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../../../components/LoadingOverlayProvider'
import {type DeepLinkRequestClubAdmition} from '../../../../utils/deepLinks/parseDeepLink'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {clubsToKeyHolderAtom} from '../clubsToKeyHolderV2Atom'
import {clubsWithMembersAtom} from '../clubsWithMembersAtom'
import {syncSingleClubHandleStateWhenNotFoundActionAtom} from '../refreshClubsActionAtom'
import {SelectClubComponent} from './SelectClubComponent'

class NoClubsToModerateError extends Schema.TaggedError<NoClubsToModerateError>(
  'NoClubsToModerateError'
)('NoClubsToModerateError', {}) {}

const clubsIModerateAtom = atom((get) =>
  pipe(
    get(clubsWithMembersAtom),
    Array.filter((club) => club.isModerator)
  )
)

export const admitUserToClubActionAtom = atom(
  null,
  (get, set, link: DeepLinkRequestClubAdmition) =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)

      const clubsIModerate = get(clubsIModerateAtom)
      if (!Array.isNonEmptyArray(clubsIModerate)) {
        Alert.alert(t('clubs.youDontModerateAnyClub'))
        return yield* _(Effect.fail(new NoClubsToModerateError()))
      }

      const selectedClubAtom = atom(Array.headNonEmpty(clubsIModerate))

      if (clubsIModerate.length > 1) {
        const confirmed = yield* _(
          set(globalDialogAtom, {
            title: t('clubs.admition.selectClub.title'),
            subtitle: t('clubs.admition.selectClub.text'),
            children: React.createElement(SelectClubComponent, {
              clubs: clubsIModerate,
              selectedClubAtom,
              showHeader: false,
            }),
            positiveButtonText: t('common.next'),
          })
        )

        if (!confirmed)
          return yield* _(Effect.fail({_tag: 'UserDeclinedError'}))
      }

      const selectedClub = get(selectedClubAtom)

      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('clubs.admition.title', {
            club: selectedClub.club.name,
          }),
          subtitle: t('clubs.admition.text', {
            club: selectedClub.club.name,
          }),
          positiveButtonText: t('common.next'),
          negativeButtonText: t('common.cancel'),
        })
      )

      if (!confirmed) return yield* _(Effect.fail({_tag: 'UserDeclinedError'}))

      const clubKey = yield* _(
        get(clubsToKeyHolderAtom),
        Record.get(selectedClub.club.uuid)
      )

      const api = get(apiAtom)
      set(loadingOverlayDisplayedAtom, true)
      yield* _(
        api.contact.addUserToTheClub({
          adminitionRequest: {
            langCode: link.langCode,
            notificationToken: link.notificationToken,
            vexlNotificationToken: link.vexlNotificationToken,
            publicKey: link.publicKey,
            publicKeyV2: link.publicKeyV2,
          },
          clubUuid: get(selectedClubAtom).club.uuid,
          keyPair: clubKey.oldKeyPair,
          keyPairV2: clubKey.keyPair,
        }),
        Effect.ensuring(
          Effect.sync(() => {
            set(loadingOverlayDisplayedAtom, false)
          })
        ),
        Effect.zipLeft(
          Effect.ignore(
            set(syncSingleClubHandleStateWhenNotFoundActionAtom, {
              clubUuid: selectedClub.club.uuid,
            })
          )
        )
      )
      return {selectedClub}
    }).pipe(
      Effect.tap(({selectedClub}) =>
        set(globalDialogAtom, {
          title: get(translationAtom).t('common.success'),
          subtitle: get(translationAtom).t('clubs.admition.success', {
            club: selectedClub.club.name,
          }),
          positiveButtonText: get(translationAtom).t('common.ok'),
        })
      ),
      Effect.tapError((e) => {
        const {t} = get(translationAtom)
        if (e._tag === 'ClubUserLimitExceededError') {
          showErrorAlert({
            title: t('clubs.admition.limitExceeded'),
          })
        } else if (e._tag === 'MemberAlreadyInClubError') {
          showErrorAlert({
            title: t('clubs.admition.alreadyMember'),
          })
        } else if (
          e._tag === 'NoClubsToModerateError' ||
          e._tag === 'UserDeclinedError'
        ) {
          return Effect.void
        } else {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description: t('common.somethingWentWrongDescription'),
            error: e,
          })
        }

        return Effect.void
      })
    )
)
