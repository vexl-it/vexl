import {useNavigation} from '@react-navigation/native'
import {type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import React from 'react'
import {Text, XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Button from '../../Button'
import {ImageUniversal} from '../../Image'

interface Props {
  club: ClubInfo
}

function CommonClubListItem({club}: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <XStack ai="center" jc="space-between">
      <XStack ai="center" gap="$4">
        <ImageUniversal
          width={50}
          height={50}
          source={{type: 'imageUri', imageUri: club.clubImageUrl}}
        />
        <Text ff="$body500" fos={18} col="$black">
          {club.name}
        </Text>
      </XStack>
      <Button
        onPress={() => {
          navigation.navigate('ClubDetail', {
            clubUuid: club.uuid,
          })
        }}
        variant="secondary"
        text={t('common.seeDetail')}
        size="small"
      />
    </XStack>
  )
}

export default CommonClubListItem
