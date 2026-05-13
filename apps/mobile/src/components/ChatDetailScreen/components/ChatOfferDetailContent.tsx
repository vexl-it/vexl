import {useNavigation} from '@react-navigation/native'
import {
  Button,
  FlagReport,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, Stack, useTheme} from 'tamagui'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import CommonFriends from '../../CommonFriends'
import OfferAuthorBanner from '../../OfferAuthorBanner'
import {reportOfferActionAtom} from '../../OfferDetailScreen/atoms'
import OfferPropertiesCard from '../../OfferPropertiesCard'
import {chatMolecule} from '../atoms'

export default function ChatOfferDetailContent({
  chatExists,
}: {
  chatExists: boolean
}): React.ReactElement {
  useStatusBarStyleForScreen('primary')
  const navigation = useNavigation()
  const theme = useTheme()
  const {bottom} = useSafeAreaInsets()
  const {t} = useTranslation()
  const reportOffer = useSetAtom(reportOfferActionAtom)
  const {
    chatAtom,
    commonConnectionsHashesAtom,
    offerForChatAtom,
    otherSideClubsIdsAtom,
    otherSideDataAtom,
    shouldGrayScaleAvatarAtom,
    theirOfferAndNotReportedAtom,
    verifiedConnectionsHashesAtom,
  } = useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const theirOfferAndNotReported = useAtomValue(theirOfferAndNotReportedAtom)
  const otherSideClubs = useGetAllClubsForIds(otherSideClubsIds ?? [])
  const shouldGrayScaleAvatar = useAtomValue(shouldGrayScaleAvatarAtom)

  if (!chatExists || !offer) {
    return (
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('offer.title')}
            rightActions={[
              {
                icon: XmarkCancelClose,
                onPress: () => {
                  navigation.goBack()
                },
              },
            ]}
          />
        }
      >
        <YStack flex={1} justifyContent="center" gap="$5">
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="paragraph"
          >
            {t('offer.offerNotFound')}
          </Typography>
          <Button
            onPress={() => {
              navigation.goBack()
            }}
          >
            {t('common.back')}
          </Button>
        </YStack>
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('messages.offerDetail')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: () => {
                navigation.goBack()
              },
            },
          ]}
        />
      }
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottom + getTokens().space.$8.val,
        }}
      >
        <YStack gap="$5">
          <OfferAuthorBanner
            offer={offer}
            realUserName={chat.otherSide.realLifeInfo?.userName}
            userImage={otherSideData.image}
            grayAvatar={shouldGrayScaleAvatar}
            clubIdsForAvatar={otherSideClubsIds ?? []}
          />

          <Typography color="$foregroundPrimary" variant="description">
            {offer.offerInfo.publicPart.offerDescription}
          </Typography>

          <OfferPropertiesCard offer={offer} />

          <CommonFriends
            commonConnectionsHashes={commonConnectionsHashes}
            verifiedConnectionsHashes={verifiedConnectionsHashes}
            otherSideClubs={otherSideClubs}
          />

          {theirOfferAndNotReported ? (
            <Stack position="relative">
              <Button
                backgroundColor="$backgroundSecondary"
                onPress={() => {
                  void Effect.runPromise(
                    andThenExpectBooleanNoErrors((success) => {
                      if (success) {
                        navigation.goBack()
                      }
                    })(reportOffer(offer))
                  )
                }}
              >
                {' '}
              </Button>
              <XStack
                alignItems="center"
                gap="$3"
                position="absolute"
                top={0}
                right="$5"
                bottom={0}
                left="$5"
                pointerEvents="none"
              >
                <FlagReport
                  color={theme.redForeground.get()}
                  size={getTokens().size.$7.val}
                />
                <Typography color="$redForeground" variant="paragraph">
                  {t('messages.reportOffer')}
                </Typography>
              </XStack>
            </Stack>
          ) : null}
        </YStack>
      </ScrollView>
    </Screen>
  )
}
