import {useNavigation} from '@react-navigation/native'
import {Avatar, ClubCard} from '@vexl-next/ui'
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {type ClubWithMembers} from '../../../../../state/clubs/domain'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function ClubCardItem({
  clubWithMembersAtom,
}: {
  readonly clubWithMembersAtom: Atom<ClubWithMembers>
}): React.JSX.Element {
  const {club, members} = useAtomValue(clubWithMembersAtom)
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const navigation = useNavigation()

  return (
    <ClubCard
      avatar={<Avatar size="$9" source={{uri: club.clubImageUrl}} />}
      name={club.name}
      subtitle={t('clubs.commonFriendsFormatted', {
        localizedString: formatInteger(members.length, locale),
      })}
      onPress={() => {
        navigation.navigate('ClubDetail', {clubUuid: club.uuid})
      }}
    />
  )
}

export default ClubCardItem
