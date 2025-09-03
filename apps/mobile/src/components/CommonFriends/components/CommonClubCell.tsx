import {type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import React from 'react'
import {Text, XStack} from 'tamagui'
import {ImageUniversal} from '../../Image'

interface Props {
  club: ClubInfo
  variant: 'light' | 'dark'
}

function CommonClubCell({club, variant}: Props): React.ReactElement {
  return (
    <XStack ai="center" mr="$3">
      <ImageUniversal
        key={club.uuid}
        width={30}
        height={30}
        source={{type: 'imageUri', imageUri: club.clubImageUrl}}
      />
      <Text
        ml="$2"
        col={variant === 'light' ? '$greyOnWhite' : '$white'}
        ff="$body500"
        fos={12}
      >
        {club.name}
      </Text>
    </XStack>
  )
}

export default CommonClubCell
