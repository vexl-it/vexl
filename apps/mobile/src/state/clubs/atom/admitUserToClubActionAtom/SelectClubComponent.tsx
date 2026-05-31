import {
  Avatar,
  ScrollView,
  SelectClubCell,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Array} from 'effect'
import {type PrimitiveAtom, useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {formatDecimal} from '../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../utils/localization/formattingLocaleAtom'
import {type ClubWithMembers} from '../../domain'

const MAX_LIST_HEIGHT = 360
const LIST_HEIGHT_TO_WINDOW_RATIO = 0.45

export function SelectClubComponent({
  clubs,
  selectedClubAtom,
  showHeader = true,
}: {
  clubs: Array.NonEmptyReadonlyArray<ClubWithMembers>
  selectedClubAtom: PrimitiveAtom<ClubWithMembers>
  showHeader?: boolean
}): React.ReactElement {
  const [selectedClub, setSelectedClub] = useAtom(selectedClubAtom)
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {height} = useWindowDimensions()
  const listMaxHeight = Math.min(
    MAX_LIST_HEIGHT,
    height * LIST_HEIGHT_TO_WINDOW_RATIO
  )

  return (
    <YStack gap="$3">
      {!!showHeader && (
        <>
          <Typography variant="heading3" color="$foregroundPrimary">
            {t('clubs.admition.selectClub.title')}
          </Typography>
          <Typography variant="paragraph" color="$foregroundSecondary" mb="$1">
            {t('clubs.admition.selectClub.text')}
          </Typography>
        </>
      )}
      <ScrollView
        maxHeight={listMaxHeight}
        showsVerticalScrollIndicator={clubs.length > 3}
      >
        <YStack gap="$3">
          {Array.map(clubs, (clubWithMembers) => {
            const membersCount = formatDecimal(
              clubWithMembers.members.length,
              locale
            )

            return (
              <SelectClubCell
                key={clubWithMembers.club.uuid}
                name={clubWithMembers.club.name}
                description={t('clubs.members', {membersCount})}
                selected={selectedClub.club.uuid === clubWithMembers.club.uuid}
                avatar={
                  <Avatar
                    size="small"
                    customSize={40}
                    source={{uri: clubWithMembers.club.clubImageUrl}}
                  />
                }
                onPress={() => {
                  setSelectedClub(clubWithMembers)
                }}
              />
            )
          })}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
