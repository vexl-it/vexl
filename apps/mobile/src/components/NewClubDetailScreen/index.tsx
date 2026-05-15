import {
  Button,
  ChevronLeft,
  Menu,
  MenuItem,
  NavigationBar,
  Screen,
  SignOut,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {singleClubAtom} from '../../state/clubs/atom/clubsWithMembersAtom'
import {leaveClubActionAtom} from '../../state/clubs/atom/leaveClubActionAtom'
import {createOfferCountForClub} from '../../state/marketplace/atoms/offersState'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showErrorAlert} from '../ErrorAlert'
import {globalDialogAtom} from '../GlobalDialog'
import {useShowLoadingOverlay} from '../LoadingOverlayProvider'
import {DetailHeader} from './components/DetailHeader'
import {ModeratorSection} from './components/ModeratorSection'

type Props = RootStackScreenProps<'ClubDetail'>

function ClubDetailScreen({
  navigation,
  route: {
    params: {clubUuid},
  },
}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const club = useAtomValue(useMemo(() => singleClubAtom(clubUuid), [clubUuid]))
  const offersCount = useAtomValue(
    useMemo(() => createOfferCountForClub(clubUuid), [clubUuid])
  )
  const leaveClub = useSetAtom(leaveClubActionAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const loadingOverlay = useShowLoadingOverlay()

  const footer =
    offersCount > 0 ? (
      <Button
        variant="primary"
        onPress={() => {
          navigation.navigate('ClubOffers', {clubUuid})
        }}
      >
        {t('clubs.showOffers')}
      </Button>
    ) : undefined

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('clubs.clubDetail')}
          leftAction={{
            icon: ChevronLeft,
            onPress: navigation.goBack,
          }}
        />
      }
      footer={footer}
      scrollable
    >
      {Option.match(club, {
        onNone: () => (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
            <Typography variant="paragraph" color="$foregroundPrimary">
              {t('common.nothingFound')}
            </Typography>
            <Button variant="primary" onPress={navigation.goBack}>
              {t('common.goBack')}
            </Button>
          </YStack>
        ),
        onSome: (clubWithMembers) => (
          <YStack flex={1} gap="$5">
            <DetailHeader
              clubWithMembers={clubWithMembers}
              offersCount={offersCount}
            />
            <ModeratorSection clubWithMembers={clubWithMembers} />
            <Menu>
              <MenuItem
                label={t('clubs.leaveClub')}
                icon={SignOut}
                variant="danger"
                showChevron={false}
                onPress={() => {
                  Effect.runFork(
                    Effect.gen(function* (_) {
                      const confirmed = yield* _(
                        showDialog({
                          title: t('clubs.areYouSureYouWantToLeave'),
                          subtitle: t('clubs.leavingWarning'),
                          positiveButtonText: t('common.yesLeave'),
                          positiveButtonVariant: 'destructive',
                          negativeButtonText: t('common.cancel'),
                        })
                      )

                      if (!confirmed) return

                      yield* _(
                        Effect.sync(() => {
                          loadingOverlay.show()
                        })
                      )
                      yield* _(
                        leaveClub(clubUuid).pipe(
                          Effect.ensuring(
                            Effect.sync(() => {
                              loadingOverlay.hide()
                            })
                          )
                        )
                      )
                      yield* _(
                        Effect.sync(() => {
                          navigation.goBack()
                        })
                      )
                    }).pipe(
                      Effect.catchAll((e) =>
                        Effect.sync(() => {
                          loadingOverlay.hide()
                          showErrorAlert({
                            title: t('common.somethingWentWrong'),
                            description: t(
                              'common.somethingWentWrongDescription'
                            ),
                            error: e,
                          })
                        })
                      )
                    )
                  )
                }}
              />
            </Menu>
          </YStack>
        ),
      })}
    </Screen>
  )
}

export default ClubDetailScreen
