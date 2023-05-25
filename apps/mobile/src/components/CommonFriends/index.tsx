import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {Platform, ScrollView, StyleSheet, TouchableOpacity} from 'react-native'
import Image from '../Image'
import chevronRightSvg from './images/chevronRightSvg'
import React, {useMemo} from 'react'
import {selectImportedContactsWithHashes} from '../../state/contacts'
import {useStore} from 'jotai'
import CommonFriendCell from './components/CommonFriendCell'
import {useNavigation} from '@react-navigation/native'
import {LinearGradient} from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  scrollView: {
    paddingBottom: 12,
  },
})

interface Props {
  hideCommonFriendsCount?: boolean
  contactsHashes: readonly string[]
  variant: 'light' | 'dark'
}

function CommonFriends({
  hideCommonFriendsCount,
  contactsHashes,
  variant,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const store = useStore()
  const navigation = useNavigation()
  const commonFriends = useMemo(
    () => store.get(selectImportedContactsWithHashes(contactsHashes)),
    [contactsHashes, store]
  )

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('CommonFriends', {contactsHashes})
      }}
    >
      <XStack
        pos={'relative'}
        ai={'center'}
        jc={'space-between'}
        bc={variant === 'light' ? '$greyAccent5' : '$grey'}
        br={'$4'}
        px={'$4'}
      >
        <Stack fs={1} pt={'$3'}>
          {!hideCommonFriendsCount && (
            <Text col={'$greyOnBlack'} fos={14} ff={'$body700'}>
              {t('commonFriends.commonFriendsCount', {
                commonFriendsCount: commonFriends.length,
              })}
            </Text>
          )}
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
              <XStack pb={'$3'}>
                {commonFriends.slice(0, 5).map((friend) => (
                  <CommonFriendCell
                    key={friend.hash}
                    name={friend.name}
                    imageUri={friend.imageUri}
                  />
                ))}
              </XStack>
            </MaskedView>
          ) : (
            <ScrollView
              horizontal
              contentContainerStyle={styles.scrollView}
              showsHorizontalScrollIndicator={false}
              fadingEdgeLength={100}
            >
              {commonFriends.slice(0, 5).map((friend) => (
                <CommonFriendCell
                  key={friend.hash}
                  name={friend.name}
                  imageUri={friend.imageUri}
                />
              ))}
            </ScrollView>
          )}
        </Stack>
        <Stack ai={'flex-end'} jc={'center'}>
          <Image
            stroke={
              variant === 'light'
                ? tokens.color.black.val
                : tokens.color.greyOnBlack.val
            }
            source={chevronRightSvg}
          />
        </Stack>
      </XStack>
    </TouchableOpacity>
  )
}

export default CommonFriends
