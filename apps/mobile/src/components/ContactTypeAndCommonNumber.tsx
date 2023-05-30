import {type FriendLevel} from '@vexl-next/domain/dist/general/offers'
import {useTranslation} from '../utils/localization/I18nProvider'
import {Stack, Text, XStack} from 'tamagui'
import Image from './Image'
import friendsSvg from './ChatDetailScreen/images/friendsSvg'
import React from 'react'

function ContactTypeAndCommonNumber({
  center,
  friendLevel,
  numberOfCommonFriends,
}: {
  friendLevel: FriendLevel[]
  numberOfCommonFriends: number
  center?: boolean
}): JSX.Element {
  const {t} = useTranslation()
  return (
    <XStack
      flexWrap={'wrap'}
      space="$1"
      justifyContent={center ? 'center' : 'flex-start'}
      alignItems={'center'}
    >
      <Text color="$greyOnBlack">
        {friendLevel.includes('FIRST_DEGREE') ? (
          <Text>{t('offer.directFriend')}</Text>
        ) : (
          friendLevel.includes('SECOND_DEGREE') && (
            <Text>{t('offer.friendOfFriend')}</Text>
          )
        )}
      </Text>
      <Text color="$greyOnBlack">•</Text>
      <Stack w={14} h={14}>
        <Image source={friendsSvg} />
      </Stack>
      <Text color={'$greyOnBlack'}>
        {t('offer.numberOfCommon', {
          number: numberOfCommonFriends,
        })}
      </Text>
    </XStack>
  )
}

export default ContactTypeAndCommonNumber
