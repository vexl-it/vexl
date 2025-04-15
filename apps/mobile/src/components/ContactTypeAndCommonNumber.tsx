import {useNavigation} from '@react-navigation/native'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type FriendLevel} from '@vexl-next/domain/src/general/offers'
import React from 'react'
import {TouchableWithoutFeedback} from 'react-native-gesture-handler'
import {Stack, Text, XStack} from 'tamagui'
import {useGetAllClubsNamesForIds} from '../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
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
}): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const clubsNamesForOffer = useGetAllClubsNamesForIds(clubsIds ?? [])

  return (
    <Stack
      flexDirection={
        friendLevel.length > 1 && friendLevel.includes('CLUB')
          ? 'column'
          : 'row'
      }
      ai={center ? 'center' : 'flex-start'}
    >
      <XStack ai="center" gap="$1">
        <Text
          gap="$1"
          col="$greyOnBlack"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {(friendLevel.includes('FIRST_DEGREE') ||
            friendLevel.includes('SECOND_DEGREE')) && (
            <>
              {friendLevel.includes('FIRST_DEGREE')
                ? t('offer.directFriend')
                : friendLevel.includes('SECOND_DEGREE') &&
                  t('offer.friendOfFriend')}
              {' • '}
            </>
          )}
          {!!clubsNamesForOffer &&
            clubsNamesForOffer.length === 1 &&
            clubsNamesForOffer.map((clubName) => clubName)}
          {friendLevel.length === 1 && friendLevel.includes('CLUB') && ` • `}
          {!!clubsNamesForOffer &&
            clubsNamesForOffer.length > 1 &&
            t('clubs.multipleClubs')}
        </Text>
      </XStack>
      <XStack ai="center" gap="$1">
        <Stack w={14} h={14}>
          <Image source={friendsSvg} />
        </Stack>
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
              number: numberOfCommonFriends,
            })}
          </Text>
        </TouchableWithoutFeedback>
      </XStack>
    </Stack>
  )
}

export default ContactTypeAndCommonNumber
