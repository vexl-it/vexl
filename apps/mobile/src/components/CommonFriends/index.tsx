import MaskedView from '@react-native-masked-view/masked-view'
import {useNavigation} from '@react-navigation/native'
import {LinearGradient} from 'expo-linear-gradient'
import {useSetAtom, useStore} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {Platform, ScrollView, StyleSheet, TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {type OneOfferInState} from '../../../../../packages/domain/src/general/offers'
import chevronRightSvg from '../../images/chevronRightSvg'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {friendLevelBannerPreferenceAtom} from '../../utils/preferences'
import Image from '../Image'
import Info from '../Info'
import showCommonFriendsExplanationUIActionAtom from '../OfferDetailScreen/atoms'
import CommonFriendCell from './components/CommonFriendCell'

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
})

interface Props {
  contactsHashes: readonly string[]
  hideCommonFriendsCount?: boolean
  hideInfo?: boolean
  offer: OneOfferInState
  variant: 'light' | 'dark'
}

function CommonFriends({
  hideCommonFriendsCount,
  hideInfo,
  contactsHashes,
  offer,
  variant,
}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const tokens = getTokens()
  const store = useStore()
  const navigation = useNavigation()
  const commonFriends = useMemo(
    () => store.get(createImportedContactsForHashesAtom(contactsHashes)),
    [contactsHashes, store]
  )

  const showCommonFriendsExplanationUIAction = useSetAtom(
    showCommonFriendsExplanationUIActionAtom
  )

  const friendLevel = (() => {
    if (offer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE'))
      return t('offer.directFriend')
    return t('offer.friendOfFriend')
  })()

  const onWhatDoesThisMeanPressed = useCallback(() => {
    void showCommonFriendsExplanationUIAction({offer})
  }, [showCommonFriendsExplanationUIAction, offer])

  if (commonFriends.length === 0) return null

  return (
    <YStack space="$2">
      <TouchableOpacity
        disabled={commonFriends.length === 0}
        onPress={() => {
          navigation.navigate('CommonFriends', {contactsHashes})
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
            {!hideCommonFriendsCount && (
              <Text col="$white" fos={14} mb="$2">
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
                <XStack ai="center">
                  {commonFriends.slice(0, 5).map((friend) => (
                    <CommonFriendCell
                      key={friend.computedValues.hash}
                      name={friend.info.name}
                      imageUri={friend.info.imageUri}
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
                {commonFriends.slice(0, 5).map((friend) => (
                  <CommonFriendCell
                    key={`${friend.computedValues.hash} - ${friend.info.name}`}
                    name={friend.info.name}
                    imageUri={friend.info.imageUri}
                    variant={variant}
                  />
                ))}
              </ScrollView>
            )}
          </Stack>
          {commonFriends.length !== 0 && (
            <Stack ai="flex-end" jc="center">
              <Image
                stroke={
                  variant === 'light'
                    ? tokens.color.black.val
                    : tokens.color.greyOnBlack.val
                }
                source={chevronRightSvg}
              />
            </Stack>
          )}
        </XStack>
      </TouchableOpacity>
      {!hideInfo && (
        <Info
          visibleStateAtom={friendLevelBannerPreferenceAtom}
          text={t('common.whatDoesThisMean', {term: friendLevel})}
          actionButtonText={t('common.learnMore')}
          onActionPress={onWhatDoesThisMeanPressed}
        />
      )}
    </YStack>
  )
}

export default CommonFriends
