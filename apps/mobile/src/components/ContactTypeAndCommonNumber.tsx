import {useNavigation} from '@react-navigation/native'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type FriendLevel} from '@vexl-next/domain/src/general/offers'
import {useSetAtom} from 'jotai'
import React from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {useGetAllClubsNamesForIds} from '../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../utils/localization/localizedNumbersAtoms'
import friendsSvg from './ChatDetailScreen/images/friendsSvg'
import Image from './Image'

function ContactTypeAndCommonNumber({
  center,
  friendLevel,
  contactsHashes,
  numberOfCommonFriends,
  clubsIds,
}: {
  friendLevel: readonly FriendLevel[]
  numberOfCommonFriends: number
  contactsHashes: readonly HashedPhoneNumber[]
  center?: boolean
  clubsIds?: readonly ClubUuid[]
}): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const clubsNamesForOffer = useGetAllClubsNamesForIds(clubsIds ?? [])
  const numberOfCommonFriendsLocalized = useSetAtom(
    localizedDecimalNumberActionAtom
  )({number: numberOfCommonFriends})

  return (
    <Stack flexDirection="row" ai={center ? 'center' : 'flex-start'}>
      <XStack ai="center" flexWrap="wrap">
        <Text col="$greyOnBlack">
          {(friendLevel.includes('FIRST_DEGREE') ||
            friendLevel.includes('SECOND_DEGREE')) && (
            <>
              {friendLevel.includes('FIRST_DEGREE')
                ? `${t('offer.directFriend')} • `
                : friendLevel.includes('SECOND_DEGREE') &&
                  `${t('offer.friendOfFriend')} • `}
            </>
          )}
        </Text>
        <Text col="$greyOnBlack">
          {!!clubsNamesForOffer &&
            clubsNamesForOffer.length === 1 &&
            clubsNamesForOffer.map((clubName) => `${clubName} • `)}
        </Text>
        <Text col="$greyOnBlack">
          {!!clubsNamesForOffer &&
            clubsNamesForOffer.length > 1 &&
            `${t('clubs.multipleClubs')} • `}
        </Text>
        <XStack gap="$1" ai="center">
          <Image width={14} height={14} source={friendsSvg} />
          <TouchableWithoutFeedback
            onPress={() => {
              navigation.navigate('CommonFriends', {
                contactsHashes,
                clubsIds: clubsIds ?? [],
              })
            }}
          >
            <Text col="$greyOnBlack">
              {t('offer.numberOfCommon', {
                number: numberOfCommonFriendsLocalized,
              })}
            </Text>
          </TouchableWithoutFeedback>
        </XStack>
      </XStack>
    </Stack>
  )
}

export default ContactTypeAndCommonNumber
