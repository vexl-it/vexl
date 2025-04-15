import MaskedView from '@react-native-masked-view/masked-view'
import {useNavigation} from '@react-navigation/native'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ClubInfo} from '@vexl-next/rest-api/src/services/contact/contracts'
import {LinearGradient} from 'expo-linear-gradient'
import {useStore} from 'jotai'
import React, {useMemo} from 'react'
import {Platform, ScrollView, StyleSheet, TouchableOpacity} from 'react-native'
import {Stack, XStack, YStack, getTokens} from 'tamagui'
import chevronRightSvg from '../../images/chevronRightSvg'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import Image from '../Image'
import CommonClubCell from './components/CommonClubCell'
import CommonFriendCell from './components/CommonFriendCell'

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
})

interface Props {
  commonConnectionsHashes: readonly HashedPhoneNumber[]
  variant: 'light' | 'dark'
  otherSideClubs: ClubInfo[]
}

function CommonFriends({
  commonConnectionsHashes,
  variant,
  otherSideClubs,
}: Props): JSX.Element | null {
  const tokens = getTokens()
  const store = useStore()
  const navigation = useNavigation()
  const commonFriends = useMemo(
    () =>
      store.get(createImportedContactsForHashesAtom(commonConnectionsHashes)),
    [commonConnectionsHashes, store]
  )

  if (commonFriends.length === 0) return null

  return (
    <YStack gap="$2">
      <TouchableOpacity
        disabled={commonFriends.length === 0}
        onPress={() => {
          navigation.navigate('CommonFriends', {
            contactsHashes: commonConnectionsHashes,
            clubsIds: otherSideClubs.map((club) => club.uuid),
          })
        }}
      >
        <XStack
          pos="relative"
          ai="center"
          jc="space-between"
          bc={variant === 'light' ? '$greyAccent5' : '$grey'}
          br="$4"
          px="$4"
          py="$3"
        >
          <Stack fs={1}>
            {Platform.OS === 'ios' ? (
              <MaskedView
                maskElement={
                  <LinearGradient
                    style={styles.linearGradient}
                    colors={['transparent', 'white']}
                    locations={[1, 0.9]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                  />
                }
              >
                <XStack ai="center">
                  {otherSideClubs.map((club) => (
                    <CommonClubCell
                      key={club.uuid}
                      variant={variant}
                      club={club}
                    />
                  ))}
                  {commonFriends.slice(0, 5).map((friend) => (
                    <CommonFriendCell
                      key={friend.computedValues.hash}
                      name={friend.info.name}
                      contactId={friend.info.nonUniqueContactId}
                      variant={variant}
                    />
                  ))}
                </XStack>
              </MaskedView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                fadingEdgeLength={100}
              >
                {otherSideClubs.map((club) => (
                  <CommonClubCell
                    key={club.uuid}
                    variant={variant}
                    club={club}
                  />
                ))}
                {commonFriends.slice(0, 5).map((friend) => (
                  <CommonFriendCell
                    key={`${friend.computedValues.hash} - ${friend.info.name}`}
                    name={friend.info.name}
                    contactId={friend.info.nonUniqueContactId}
                    variant={variant}
                  />
                ))}
              </ScrollView>
            )}
          </Stack>
          {commonFriends.length !== 0 && (
            <Stack ai="flex-end" jc="center">
              <Image
                stroke={tokens.color.greyOnBlack.val}
                source={chevronRightSvg}
              />
            </Stack>
          )}
        </XStack>
      </TouchableOpacity>
    </YStack>
  )
}

export default CommonFriends
