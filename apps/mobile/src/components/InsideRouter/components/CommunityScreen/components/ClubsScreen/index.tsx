import {Banner, Typography, YStack} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type CommunityTabsScreenProps} from '../../../../../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../../../../../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {ClubsList} from './components/ClubsList'

type Props = CommunityTabsScreenProps<'Clubs'>

function ClubsScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const clubsAtoms = useAtomValue(clubsWithMembersAtomsAtom)
  const hasClubs = clubsAtoms.length > 0

  return (
    <YStack flex={1} paddingHorizontal="$5" paddingTop="$6" gap="$5">
      {hasClubs ? (
        <Banner
          color="pink"
          title={t('clubs.joinAClub')}
          description={t('clubs.joinAClubDescription')}
          primaryButton={{
            label: t('clubs.joinNewClub'),
            onPress: () => {
              navigation.navigate('JoinClubFlow', {
                screen: 'ScanClubQrCodeScreen',
              })
            },
          }}
          secondaryButton={{
            label: t('clubs.moreInfo'),
            onPress: () => {
              navigation.navigate('WhatAreClubs')
            },
          }}
        />
      ) : null}

      {hasClubs ? (
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {t('clubs.yourClubs')}
        </Typography>
      ) : null}

      <ClubsList navigation={navigation} />
    </YStack>
  )
}

export default ClubsScreen
