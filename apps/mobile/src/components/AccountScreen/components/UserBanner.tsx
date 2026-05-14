import {useNavigation} from '@react-navigation/native'
import {Avatar, Button, tokens, Typography, XStack, YStack} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {useAtomValue} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {
  anonymizedUserDataAtom,
  realUserDataAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import SvgImage from '../../Image'

function UserBanner(): React.ReactElement {
  const realUserData = useAtomValue(realUserDataAtom)
  const anonymizedUserData = useAtomValue(anonymizedUserDataAtom)
  const userPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'Account'>['navigation']>()

  const displayName = realUserData?.userName ?? t('common.anonymous')
  const profileImage = realUserData?.image ?? anonymizedUserData.image
  const formattedPhoneNumber = useMemo(
    () =>
      parsePhoneNumber(userPhoneNumber).number?.international ??
      userPhoneNumber,
    [userPhoneNumber]
  )

  const handleSharePress = useCallback(() => {
    navigation.navigate('ShareProfile')
  }, [navigation])
  const handleEditPress = useCallback(() => {
    navigation.navigate('EditProfile')
  }, [navigation])

  return (
    <XStack alignItems="center" gap="$3" paddingVertical="$4">
      {profileImage.type === 'svgXml' ? (
        <Avatar size="$9">
          <SvgImage
            width={tokens.size[9].val}
            height={tokens.size[9].val}
            source={profileImage.svgXml}
          />
        </Avatar>
      ) : (
        <Avatar
          size="$9"
          source={{uri: resolveLocalUri(profileImage.imageUri)}}
        />
      )}
      <YStack flex={1} minWidth={0} justifyContent="space-between">
        <Typography
          variant="paragraphSmallBold"
          color="$foregroundPrimary"
          numberOfLines={1}
          lineHeight={0}
        >
          {displayName}
        </Typography>
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          numberOfLines={1}
          lineHeight={0}
        >
          {formattedPhoneNumber}
        </Typography>
      </YStack>
      <XStack gap="$3">
        <Button size="small" variant="tertiary" onPress={handleSharePress}>
          {t('common.share')}
        </Button>
        <Button size="small" variant="tertiary" onPress={handleEditPress}>
          {t('common.edit')}
        </Button>
      </XStack>
    </XStack>
  )
}

export default UserBanner
