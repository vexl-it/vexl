import {useNavigation} from '@react-navigation/native'
import {
  Menu,
  MenuItem,
  QrCode,
  Refresh,
  Send,
  Stack,
  YStack,
} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  regenerateClubLinkActionAtom,
  useClubInviteLink,
} from '../../ClubDetail/state'
import {globalDialogAtom} from '../../GlobalDialog'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {SharableQrCode} from '../../SharableQrCode'
import {InviteCodeRow} from './InviteCodeRow'

export function ModeratorSection({
  clubWithMembers,
}: {
  readonly clubWithMembers: ClubWithMembers
}): React.JSX.Element | null {
  const {club, isModerator} = clubWithMembers
  const {t} = useTranslation()
  const link = useClubInviteLink(club.uuid)
  const navigation =
    useNavigation<RootStackScreenProps<'ClubDetail'>['navigation']>()
  const regenerateLink = useSetAtom(regenerateClubLinkActionAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const loadingOverlay = useShowLoadingOverlay()

  if (!isModerator) return null

  return (
    <YStack gap="$5">
      {Option.match(link, {
        onNone: () => null,
        onSome: (clubLink) => <InviteCodeRow code={clubLink.code} />,
      })}

      <Menu>
        <MenuItem
          label={t('clubs.moderator.displayQRCode')}
          icon={QrCode}
          onPress={() => {
            if (Option.isNone(link)) return

            Effect.runFork(
              showDialog({
                title: t('clubs.moderator.inviteQrCode.title'),
                subtitle: t('clubs.moderator.inviteQrCode.text'),
                positiveButtonText: t('common.close'),
                children: (
                  <Stack alignItems="center">
                    <SharableQrCode
                      size={300}
                      value={link.value.fullLink}
                      logo={{uri: club.clubImageUrl}}
                    />
                  </Stack>
                ),
              })
            )
          }}
        />
        <MenuItem
          label={t('clubs.moderator.inviteUserWithCode')}
          icon={Send}
          onPress={() => {
            navigation.navigate('ScanClubAdmissionQrCode')
          }}
        />
        <MenuItem
          label={t('clubs.moderator.regenerateInviteCode')}
          icon={Refresh}
          onPress={() => {
            loadingOverlay.show()
            Effect.runFork(
              regenerateLink(club.uuid).pipe(
                Effect.ensuring(
                  Effect.sync(() => {
                    loadingOverlay.hide()
                  })
                )
              )
            )
          }}
        />
      </Menu>
    </YStack>
  )
}
