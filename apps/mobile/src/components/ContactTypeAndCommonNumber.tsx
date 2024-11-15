import {useNavigation} from '@react-navigation/native'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type FriendLevel} from '@vexl-next/domain/src/general/offers'
import React from 'react'
import {TouchableWithoutFeedback} from 'react-native-gesture-handler'
import {Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import friendsSvg from './ChatDetailScreen/images/friendsSvg'
import Image from './Image'

function ContactTypeAndCommonNumber({
  center,
  friendLevel,
  contactsHashes,
  numberOfCommonFriends,
}: {
  friendLevel: readonly FriendLevel[]
  numberOfCommonFriends: number
  contactsHashes: readonly HashedPhoneNumber[]
  center?: boolean
}): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <XStack
      flexWrap="wrap"
      gap="$1"
      justifyContent={center ? 'center' : 'flex-start'}
      alignItems="center"
    >
      <Text col="$greyOnBlack">
        {friendLevel.includes('FIRST_DEGREE')
          ? t('offer.directFriend')
          : friendLevel.includes('SECOND_DEGREE') && t('offer.friendOfFriend')}
      </Text>
      <Text col="$greyOnBlack">•</Text>
      <XStack ai="center" gap="$1">
        <Stack w={14} h={14}>
          <Image source={friendsSvg} />
        </Stack>
        <TouchableWithoutFeedback
          onPress={() => {
            navigation.navigate('CommonFriends', {
              contactsHashes,
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
    </XStack>
  )
}

export default ContactTypeAndCommonNumber
