import {useNavigation} from '@react-navigation/native'
import {Array, Effect, Option} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {Image, Stack, Text, XStack, YStack} from 'tamagui'
import membersSvg from '../../../images/memberSvg'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import {createOfferCountForClub} from '../../../state/marketplace/atoms/offersState'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../utils/showErrorAlert'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import Button from '../../Button'
import SvgImage from '../../Image'
import arrowsSvg from '../../images/arrowsSvg'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {leaveClubWithAreYouSureActionAtom} from '../utils/leaveClubWithAreYouSureActionAtom'
import {ClubModeratorData} from './ClubModeratorData'

export function ClubDetail({
  club: {club, members, isModerator},
}: {
  club: ClubWithMembers
}): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const loadingOverlay = useShowLoadingOverlay()

  const offersCount = useAtomValue(
    useMemo(() => createOfferCountForClub(club.uuid), [club.uuid])
  )

  const goBack = useSafeGoBack()
  const leaveClub = useSetAtom(leaveClubWithAreYouSureActionAtom)

  return (
    <YStack mt="$4" f={1} gap="$4">
      <Stack f={1} gap="$6">
        <XStack alignItems="center" gap="$6">
          <Text ff="$body400" fontSize={32} f={1}>
            {club.name}
          </Text>
          <Image width={48} height={48} src={club.clubImageUrl} />
        </XStack>
        <YStack bc="$grey" p="$4" br="$4" gap="$2">
          {Option.isSome(club.description) && (
            <Text ff="$body500" fontSize={15} lineHeight={15}>
              {club.description.value}
            </Text>
          )}
          <XStack alignItems="center" gap="$1">
            <SvgImage
              width={12}
              height={12}
              stroke="#AFAFAF"
              source={membersSvg}
            />
            <Text fontSize={12} ff="$body500" col="$greyOnBlack">
              {t('clubs.members', {
                membersCount: pipe(members, Array.length),
              })}
            </Text>

            <Text fontSize={12} ff="$body500" col="$greyOnBlack">
              {' • '}
            </Text>
            <SvgImage
              transform={[{rotate: '90deg'}]}
              width={12}
              height={12}
              stroke="#AFAFAF"
              source={arrowsSvg}
            />
            <Text fontSize={12} ff="$body500" col="$greyOnBlack">
              {t('clubs.offers', {
                count: offersCount,
              })}
            </Text>
          </XStack>
          <Stack mt="$4">
            {!!isModerator && <ClubModeratorData club={club} />}
          </Stack>
        </YStack>
      </Stack>

      <YStack gap="$4">
        <Button
          size="large"
          variant="secondary"
          text={t('clubs.showOffers')}
          onPress={() => {
            navigation.navigate('ClubOffers', {clubUuid: club.uuid})
          }}
        />
        <Button
          size="large"
          variant="redDark"
          text={t('clubs.leaveClub')}
          onPress={() => {
            loadingOverlay.show()
            Effect.runFork(
              leaveClub(club.uuid).pipe(
                Effect.match({
                  onFailure: (e) => {
                    if (e._tag !== 'UserDeclinedError')
                      showErrorAlert({
                        title: t('common.unknownError'),
                        error: e,
                      })
                    loadingOverlay.hide()
                  },
                  onSuccess: () => {
                    goBack()
                    loadingOverlay.hide()
                  },
                })
              )
            )
          }}
        />
      </YStack>
    </YStack>
  )
}
