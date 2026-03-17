import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {
  CommonFriends as CommonFriendsUI,
  type CommonFriend,
} from '@vexl-next/ui'
import {Array, Effect, HashMap, Option, pipe} from 'effect'
import {getContactByIdAsync} from 'expo-contacts'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Platform} from 'react-native'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showVerifiedContactsAtom} from '../../utils/preferences'
import {commonFriendsModalDataAtom} from './atoms'

interface Props {
  commonConnectionsHashes: readonly HashedPhoneNumber[]
  verifiedConnectionsHashes?: readonly HashedPhoneNumber[]
  otherSideClubs: ClubInfo[]
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
  const store = useStore()
  const setModalData = useSetAtom(commonFriendsModalDataAtom)
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)
  const commonFriendsCount = commonConnectionsHashes.length

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
    setModalData({
      contactsHashes: commonConnectionsHashes,
      verifiedHashes: verifiedConnectionsHashes,
    })
  }, [commonConnectionsHashes, setModalData, verifiedConnectionsHashes])

  const clubChips: readonly CommonFriend[] = useMemo(
    () =>
      pipe(
        otherSideClubs,
        Array.map((club) => ({
          id: club.uuid,
          name: club.name,
          avatarSource: {uri: club.clubImageUrl},
        }))
      ),
    [otherSideClubs]
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
    () => Array.appendAll(clubChips, friendChips),
    [clubChips, friendChips]
  )

  if (commonFriendsCount === 0) return null

  return (
    <CommonFriendsUI
      label={t('offer.numberOfCommon', {number: commonFriendsCount})}
      friends={friends}
      onPress={handlePress}
    />
  )
}

export default CommonFriends
