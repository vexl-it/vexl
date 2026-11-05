import {
  Avatar,
  AvatarBasic1,
  Banner,
  CellPhoneMobileDevice,
  ChatBubbles,
  ChevronLeft,
  getTokens,
  NavButton,
  NavigationBar,
  PencilWriteEdit,
  resolveSizePx,
  Screen,
  TwoToneCard,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type EditProfileStackScreenProps} from '../../../navigationTypes'
import {
  realUserDataAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {lastUsedOfferSpokenLanguagesAtom} from '../../../utils/preferences'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import useSafeGoBack from '../../../utils/useSafeGoBack'

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <TwoToneCard>
      <TwoToneCard.Header padding="$5" gap="$3">
        <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
          {title}
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          {subtitle}
        </Typography>
      </TwoToneCard.Header>
      <TwoToneCard.Content padding="$5">{children}</TwoToneCard.Content>
    </TwoToneCard>
  )
}

function EditProfileDefaultScreen({
  navigation,
}: EditProfileStackScreenProps<'EditProfileDefault'>): React.ReactElement {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()
  const theme = useTheme()
  const iconSize = getTokens().size.$7.val
  const phoneNumber = useAtomValue(userPhoneNumberAtom)
  const realUserData = useAtomValue(realUserDataAtom)
  const spokenLanguages = useAtomValue(lastUsedOfferSpokenLanguagesAtom)
  const spokenLanguagesText = pipe(
    spokenLanguages,
    Array.map((language) => t(`offerForm.spokenLanguages.${language}`)),
    Array.join(', ')
  )
  const hasRealUserIdentity = !!realUserData?.userName || !!realUserData?.image

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editProfileScreen.title')}
          leftAction={{
            icon: ChevronLeft,
            onPress: goBack,
          }}
        />
      }
    >
      <YStack gap="$5">
        {hasRealUserIdentity ? (
          <Card
            title={t('editProfileScreen.identity.title')}
            subtitle={t('editProfileScreen.identity.subtitle')}
          >
            <XStack alignItems="center" gap="$3">
              {realUserData.image ? (
                <Avatar
                  size="$9"
                  source={{uri: resolveLocalUri(realUserData.image.imageUri)}}
                />
              ) : (
                <Avatar size="$9">
                  <AvatarBasic1 size={resolveSizePx('$9')} />
                </Avatar>
              )}
              <Typography
                variant="descriptionBold"
                color="$foregroundPrimary"
                flex={1}
              >
                {realUserData.userName ??
                  t('editProfileScreen.identity.photoFallback')}
              </Typography>
              <NavButton
                variant="normal"
                icon={PencilWriteEdit}
                onPress={() => {
                  navigation.navigate('EditIdentity')
                }}
              />
            </XStack>
          </Card>
        ) : (
          <Banner
            color="pink"
            title={t('editProfileScreen.addIdentity.title')}
            description={t('editProfileScreen.addIdentity.description')}
            primaryButton={{
              label: t('editProfileScreen.addIdentity.button'),
              onPress: () => {
                navigation.navigate('EditIdentity')
              },
            }}
          />
        )}
        <Card
          title={t('editProfileScreen.vexlAlias.title')}
          subtitle={t('editProfileScreen.vexlAlias.subtitle')}
        >
          <XStack alignItems="center" gap="$3">
            <Avatar size="small">
              <AvatarBasic1 size={resolveSizePx('small')} />
            </Avatar>
            <Typography variant="descriptionBold" color="$foregroundPrimary">
              {t('offer.directFriend')}
            </Typography>
          </XStack>
        </Card>
        <Card
          title={t('editProfileScreen.phoneNumber.title')}
          subtitle={t('editProfileScreen.phoneNumber.subtitle')}
        >
          <XStack alignItems="center" gap="$3">
            <CellPhoneMobileDevice
              size={iconSize}
              color={theme.foregroundSecondary.get()}
            />
            <Typography variant="descriptionBold" color="$foregroundPrimary">
              {getInternationalPhoneNumber(phoneNumber)}
            </Typography>
          </XStack>
        </Card>
        <Card
          title={t('editProfileScreen.spokenLanguages.title')}
          subtitle={t('editProfileScreen.spokenLanguages.subtitle')}
        >
          <XStack alignItems="center" gap="$3">
            <ChatBubbles
              size={iconSize}
              color={theme.foregroundSecondary.get()}
            />
            <Typography
              variant="descriptionBold"
              color="$foregroundPrimary"
              flex={1}
            >
              {spokenLanguagesText}
            </Typography>
            <NavButton
              variant="normal"
              icon={PencilWriteEdit}
              onPress={() => {
                navigation.navigate('EditProfileSpokenLanguages')
              }}
            />
          </XStack>
        </Card>
      </YStack>
    </Screen>
  )
}

export default EditProfileDefaultScreen
