import {Array, Effect, pipe, Record} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../../api'
import {askAreYouSureActionAtom} from '../../../../components/AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../../../components/LoadingOverlayProvider'
import {type DeepLinkRequestClubAdmition} from '../../../../utils/deepLinks/parseDeepLink'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../../utils/showErrorAlert'
import {clubsToKeyHolderAtom} from '../clubsToKeyHolderAtom'
import {clubsWithMembersAtom} from '../clubsWithMembersAtom'
import {syncSingleClubHandleStateWhenNotFoundActionAtom} from '../refreshClubsActionAtom'
import {SelectClubComponent} from './SelectClubComponent'

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
        return yield* _(Effect.fail({_tag: 'NoClubsToModerateError' as const}))
      }

      const selectedClubAtom = atom(Array.headNonEmpty(clubsIModerate))

      if (clubsIModerate.length > 1) {
        yield* _(
          set(askAreYouSureActionAtom, {
            variant: 'info',
            steps: [
              {
                type: 'StepWithChildren',
                MainSectionComponent: SelectClubComponent,
                positiveButtonText: 'next',
                mainSectionComponentProps: {
                  clubs: clubsIModerate,
                  selectedClubAtom,
                },
              },
            ],
          })
        )
      }

      const selectedClub = get(selectedClubAtom)

      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              imageSource: {
                type: 'imageUri',
                imageUri: selectedClub.club.clubImageUrl,
              },
              title: t('clubs.admition.title', {
                club: selectedClub.club.name,
              }),
              description: t('clubs.admition.text', {
                club: selectedClub.club.name,
              }),
              positiveButtonText: t('common.next'),
              negativeButtonText: t('common.cancel'),
            },
          ],
        })
      )

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
            publicKey: link.publicKey,
          },
          clubUuid: get(selectedClubAtom).club.uuid,
          keyPair: clubKey,
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
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              imageSource: {
                type: 'imageUri',
                imageUri: selectedClub.club.clubImageUrl,
              },
              title: get(translationAtom).t('common.success'),
              description: get(translationAtom).t('clubs.admition.success', {
                club: selectedClub.club.name,
              }),
              positiveButtonText: get(translationAtom).t('common.ok'),
            },
          ],
        })
      ),
      Effect.tapError((e) =>
        Effect.sync(() => {
          const {t} = get(translationAtom)
          if (e._tag === 'ClubUserLimitExceededError') {
            Alert.alert(t('clubs.admition.limitExceeded'))
          } else if (e._tag === 'MemberAlreadyInClubError') {
            Alert.alert(t('clubs.admition.alreadyMember'))
          } else if (e._tag === 'UserDeclinedError') {
            // Nothing here
          } else {
            showErrorAlert({
              title: t('common.unknownError'),
              error: e,
            })
          }
        })
      )
    )
)
