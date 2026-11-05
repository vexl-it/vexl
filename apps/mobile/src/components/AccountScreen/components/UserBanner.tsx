import {useNavigation} from '@react-navigation/native'
import {CardButton, PersonRow, tokens, XStack} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {useAtomValue} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {Pressable} from 'react-native'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {
  anonymizedUserDataAtom,
  realUserDataAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {ProfileImageAvatar} from '../../ProfileImageAvatar'

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
    <PersonRow
      size="large"
      avatar={
        <Pressable
          accessibilityLabel={t('editProfileScreen.title')}
          accessibilityRole="button"
          hitSlop={tokens.space[2].val}
          onPress={handleEditPress}
        >
          <ProfileImageAvatar image={profileImage} size="$9" />
        </Pressable>
      }
      title={displayName}
      subtitle={formattedPhoneNumber}
      trailing={
        <XStack gap="$3">
          <CardButton contrast onPress={handleSharePress}>
            {t('common.share')}
          </CardButton>
          <CardButton contrast onPress={handleEditPress}>
            {t('common.edit')}
          </CardButton>
        </XStack>
      }
    />
  )
}

export default UserBanner
