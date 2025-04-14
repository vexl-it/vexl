import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {type ClubInfo} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Text, XStack, YStack} from 'tamagui'
import {enableHiddenFeatures} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useAtomActionRunFork} from '../../../utils/useAtomActionEffect'
import SvgImage from '../../Image'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import inviteSvg from '../image/inviteSvg'
import qrcodeSvg from '../image/qrcodeSvg'
import regenerateSvg from '../image/regenerateSvg'
import {
  errorAtom,
  fetchClubLinksActionAtom,
  isLoadingAtom,
  regenerateClubLinkActionAtom,
  useClubInviteLink,
} from '../state'
import {showJoinClubQrCodeActionAtom} from '../utils/joinClubQrCodeDialog'

const emptyFunction = (): void => {}

function ModeratorActionComponent({
  text,
  icon,
  onPress,
  showBorderTop,
}: {
  text: string
  icon?: SvgString
  onPress?: () => void
  showBorderTop?: boolean
}): JSX.Element {
  return (
    <TouchableWithoutFeedback onPress={onPress ?? emptyFunction}>
      <XStack
        py="$6"
        gap="$6"
        alignItems="center"
        borderColor="black"
        borderTopWidth={showBorderTop ? 1 : 0}
      >
        {!!icon && <SvgImage source={icon} />}
        <Text ff="$body500" fontSize={18}>
          {text}
        </Text>
      </XStack>
    </TouchableWithoutFeedback>
  )
}

export function ClubModeratorData({club}: {club: ClubInfo}): JSX.Element {
  const {t} = useTranslation()

  const isLoading = useAtomValue(isLoadingAtom)
  const error = useAtomValue(errorAtom)

  const link = useClubInviteLink(club.uuid)

  const regenerateLink = useSetAtom(regenerateClubLinkActionAtom)
  const fetchClubLinks = useAtomActionRunFork(fetchClubLinksActionAtom)

  const displayLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const showJoinClubQrCode = useSetAtom(showJoinClubQrCodeActionAtom)

  if (isLoading) {
    return (
      <YStack>
        <ModeratorActionComponent text={t('common.loading')} />
      </YStack>
    )
  }

  if (Option.isSome(error)) {
    return (
      <YStack>
        <ModeratorActionComponent
          text={t('common.errorPressToRetry')}
          onPress={() => {
            fetchClubLinks(club.uuid)
          }}
        />
      </YStack>
    )
  }

  return (
    <YStack>
      {Option.isSome(link) ? (
        <>
          <ModeratorActionComponent
            showBorderTop
            text={t('clubs.moderator.inviteCode', {code: link.value.code})}
          />
          <ModeratorActionComponent
            text={t('clubs.moderator.displayQRCode')}
            onPress={() => {
              Effect.runFork(
                showJoinClubQrCode(link.value.fullLink, club.clubImageUrl)
              )
            }}
            icon={qrcodeSvg}
          />
        </>
      ) : (
        <ModeratorActionComponent
          showBorderTop
          text={t('clubs.moderator.noInviteCodeGenerated')}
        />
      )}
      {!!enableHiddenFeatures && (
        <ModeratorActionComponent
          showBorderTop
          text={t('clubs.moderator.inviteUserWithCode')}
          onPress={() => {
            alert(
              'todo. Na tohle ještě nemáme ani design z pohledu uživatele - nějak musí jít vygenerovat můj kód. Je to easy ale pojďme to teď nekomplikovat...'
            )
          }}
          icon={inviteSvg}
        />
      )}
      <ModeratorActionComponent
        showBorderTop
        text={
          Option.isSome(link)
            ? t('clubs.moderator.regenerateInviteCode')
            : t('clubs.moderator.generateInviteCode')
        }
        onPress={() => {
          displayLoadingOverlay(true)
          Effect.runFork(
            regenerateLink(club.uuid).pipe(
              Effect.ignore,
              Effect.andThen(() => {
                displayLoadingOverlay(false)
              })
            )
          )
        }}
        icon={regenerateSvg}
      />
    </YStack>
  )
}
