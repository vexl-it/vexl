import {useNavigation} from '@react-navigation/native'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {
  CommonFriends as CommonFriendsUI,
  type CommonFriend,
} from '@vexl-next/ui'
import {Array, Effect, HashMap, Option, pipe} from 'effect'
import {getContactByIdAsync} from 'expo-contacts'
import {useAtomValue, useStore} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Platform} from 'react-native'
import {
  type CommonFriendsClub,
  type RootStackScreenProps,
} from '../../navigationTypes'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {showVerifiedContactsAtom} from '../../utils/preferences'

interface Props {
  commonConnectionsHashes: readonly HashedPhoneNumber[]
  verifiedConnectionsHashes?: readonly HashedPhoneNumber[]
  otherSideClubs: ClubInfo[]
}

function trimClubName(name: string): string {
  return name.length > 25 ? `${name.slice(0, 25)}...` : name
}

const resolveContactImage = (
  contact: StoredContactWithComputedValues
): Effect.Effect<{hash: string; uri: string} | null> =>
  Option.match(contact.info.nonUniqueContactId, {
    onNone: () => Effect.succeed(null),
    onSome: (id) =>
      pipe(
        Effect.tryPromise(() => getContactByIdAsync(id)),
        Effect.map((resolved) => {
          const uri = resolved?.image?.uri

          // TODO: lets monitor this issue in https://github.com/vexl-it/vexl/issues/1984
          // and then change back to previous behaviour once fixed
          if (
            !uri ||
            (Platform.OS === 'ios' && resolved.id?.includes(':ABPerson'))
          )
            return null
          return {hash: contact.computedValues.hash, uri}
        }),
        Effect.catchAll(() => Effect.succeed(null))
      ),
  })

function useContactImageSources(
  contacts: readonly StoredContactWithComputedValues[]
): HashMap.HashMap<string, {uri: string}> {
  const [sources, setSources] = useState<
    HashMap.HashMap<string, {uri: string}>
  >(HashMap.empty())

  useEffect(() => {
    const fiber = pipe(
      contacts,
      Effect.forEach(resolveContactImage, {concurrency: 5}),
      Effect.tap((results) => {
        setSources(
          HashMap.fromIterable(
            pipe(
              results,
              Array.filterMap(Option.fromNullable),
              Array.map((result) => [result.hash, {uri: result.uri}])
            )
          )
        )
      }),
      Effect.runFork
    )

    return () => {
      Effect.runFork(fiber.interruptAsFork(fiber.id()))
    }
  }, [contacts])

  return sources
}

function CommonFriends({
  commonConnectionsHashes,
  verifiedConnectionsHashes,
  otherSideClubs,
}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const navigation =
    useNavigation<RootStackScreenProps<'CommonFriends'>['navigation']>()
  const store = useStore()
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)
  const commonFriendsCount = commonConnectionsHashes.length
  const clubsCount = otherSideClubs.length

  const commonFriendsClubs: readonly CommonFriendsClub[] = useMemo(
    () =>
      pipe(
        otherSideClubs,
        Array.map((club) => ({
          uuid: club.uuid,
          name: club.name,
          clubImageUrl: club.clubImageUrl,
        }))
      ),
    [otherSideClubs]
  )

  const commonFriends = useMemo(
    () =>
      store.get(createImportedContactsForHashesAtom(commonConnectionsHashes)),
    [commonConnectionsHashes, store]
  )

  const verifiedHashesSet = useMemo(
    () =>
      showVerifiedContacts
        ? new Set(verifiedConnectionsHashes ?? [])
        : new Set<HashedPhoneNumber>(),
    [showVerifiedContacts, verifiedConnectionsHashes]
  )

  const sortedCommonFriends = useMemo(() => {
    if (!showVerifiedContacts) return commonFriends

    const verifiedFriends = pipe(
      commonFriends,
      Array.filter((friend) =>
        verifiedHashesSet.has(friend.computedValues.hash)
      )
    )
    const regularFriends = pipe(
      commonFriends,
      Array.filter(
        (friend) => !verifiedHashesSet.has(friend.computedValues.hash)
      )
    )

    return Array.appendAll(verifiedFriends, regularFriends)
  }, [commonFriends, showVerifiedContacts, verifiedHashesSet])

  const visibleFriendsInPreview = useMemo(
    () => Array.take(sortedCommonFriends, 5),
    [sortedCommonFriends]
  )

  const imageSources = useContactImageSources(visibleFriendsInPreview)

  const handlePress = useCallback(() => {
    navigation.navigate('CommonFriends', {
      contactsHashes: commonConnectionsHashes,
      verifiedHashes: verifiedConnectionsHashes,
      clubs: commonFriendsClubs,
    })
  }, [
    commonConnectionsHashes,
    commonFriendsClubs,
    navigation,
    verifiedConnectionsHashes,
  ])

  const clubChips: readonly CommonFriend[] = useMemo(
    () =>
      pipe(
        commonFriendsClubs,
        Array.map((club) => ({
          id: club.uuid,
          name: trimClubName(club.name),
          avatarSource: {uri: club.clubImageUrl},
        }))
      ),
    [commonFriendsClubs]
  )

  const friendChips: readonly CommonFriend[] = useMemo(
    () =>
      pipe(
        visibleFriendsInPreview,
        Array.map((friend) => ({
          id: friend.computedValues.hash,
          name: friend.info.name,
          avatarSource: Option.getOrUndefined(
            HashMap.get(imageSources, friend.computedValues.hash)
          ),
        }))
      ),
    [visibleFriendsInPreview, imageSources]
  )

  const friends: readonly CommonFriend[] = useMemo(
    () => Array.appendAll(friendChips, clubChips),
    [clubChips, friendChips]
  )

  if (commonFriendsCount === 0 && clubsCount === 0) return null

  return (
    <CommonFriendsUI
      label={
        clubsCount > 0
          ? t('offer.numberOfCommonAndClubs', {
              number: formatInteger(commonFriendsCount, locale),
              clubs: formatInteger(clubsCount, locale),
            })
          : t('offer.numberOfCommon', {
              number: formatInteger(commonFriendsCount, locale),
            })
      }
      friends={friends}
      onPress={handlePress}
    />
  )
}

export default CommonFriends
