import {type Speaker} from '@vexl-next/rest-api/src/services/content/contracts'
import {Option} from 'effect'
import React from 'react'
import {Linking} from 'react-native'
import {Image, Text, XStack} from 'tamagui'

export default function EventSpeaker({
  speaker,
}: {
  speaker: Speaker
}): React.ReactElement {
  return (
    <XStack
      padding="$1"
      borderRadius="$1"
      backgroundColor="$blackAccent1"
      gap="$1"
      onPress={() => {
        if (Option.isSome(speaker.linkToSocials)) {
          void Linking.openURL(speaker.linkToSocials.value)
        }
      }}
    >
      {Option.isSome(speaker.imageUrl) && (
        <Image
          br="$1"
          width={16}
          height={16}
          source={{uri: speaker.imageUrl.value}}
        />
      )}
      <Text color="$greyOnBlack" ff="$body600" fontSize={12}>
        {speaker.name}
      </Text>
    </XStack>
  )
}
