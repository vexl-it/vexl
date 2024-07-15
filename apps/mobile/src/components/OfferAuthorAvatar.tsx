import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import {useMemo} from 'react'
import {Stack, Text, XStack} from 'tamagui'
import {useChatForOffer} from '../state/chat/hooks/useChatForOffer'
import createImportedContactsForHashesAtom from '../state/contacts/atom/createImportedContactsForHashesAtom'
import {userDataRealOrAnonymizedAtom} from '../state/session'
import {useTranslation} from '../utils/localization/I18nProvider'
import randomName from '../utils/randomName'
import {setTimezoneOfUser} from '../utils/unixMillisecondsToLocaleDateTime'
import {AnonymousAvatarFromSeed} from './AnonymousAvatar'
import friendsSvg from './ChatDetailScreen/images/friendsSvg'
import ContactTypeAndCommonNumber from './ContactTypeAndCommonNumber'
import Image from './Image'
import UserAvatar from './UserAvatar'
import UserNameWithSellingBuying from './UserNameWithSellingBuying'

function OfferAuthorAvatar({
  offer: {offerInfo, ownershipInfo},
  negative,
  displayAsPreview,
}: {
  offer: OneOfferInState
  negative: boolean
  displayAsPreview?: boolean
}): JSX.Element {
  const chatForOffer = useChatForOffer({
    offerPublicKey: offerInfo.publicPart.offerPublicKey,
  })
  const userData = useAtomValue(userDataRealOrAnonymizedAtom)
  const {t} = useTranslation()
  const commonFriends = useAtomValue(
    useMemo(
      () =>
        createImportedContactsForHashesAtom(
          offerInfo.privatePart.commonFriends
        ),
      [offerInfo.privatePart.commonFriends]
    )
  )

  const buyingOrSellingText = (() => {
    if (offerInfo.publicPart.listingType === 'BITCOIN') {
      return offerInfo.publicPart.offerType === 'BUY'
        ? t('myOffers.offerToBuy')
        : t('myOffers.offerToSell')
    }

    return offerInfo.publicPart.offerType === 'SELL'
      ? t('myOffers.offerToBuy')
      : t('myOffers.offerToSell')
  })()

  if (displayAsPreview) {
    return (
      <>
        <AnonymousAvatarFromSeed
          grayScale={negative ?? false}
          width={48}
          height={48}
          seed={offerInfo.offerId}
        />
        <Stack f={1} ml="$2">
          <UserNameWithSellingBuying
            offerInfo={offerInfo}
            userName={
              chatForOffer?.otherSide?.realLifeInfo?.userName ??
              randomName(offerInfo.offerId)
            }
          />
          <XStack
            flexWrap="wrap"
            space="$1"
            justifyContent="flex-start"
            alignItems="center"
          >
            <Text color="$greyOnBlack">
              {t('offerForm.summaryFriendLevelInfo')}
            </Text>
            <Text color="$greyOnBlack">•</Text>
            <XStack alignItems="center" space="$1">
              <Stack width={14} height={14}>
                <Image source={friendsSvg} />
              </Stack>
              <Text color="$greyOnBlack">
                {t('offerForm.summaryNumberOfCommonFriends')}
              </Text>
            </XStack>
          </XStack>
        </Stack>
      </>
    )
  }

  return (
    <>
      {ownershipInfo ? (
        <>
          <UserAvatar width={48} height={48} userImage={userData.image} />
          <Stack f={1} ml="$2">
            <Text fos={16} ff="$body600" col="$white">
              {buyingOrSellingText}
            </Text>
            <Text fos={12} ff="$body500" col="$greyOnBlack">
              {t('myOffers.offerAdded', {
                date: setTimezoneOfUser(
                  DateTime.fromISO(offerInfo.createdAt)
                ).toLocaleString(DateTime.DATE_FULL),
              })}
            </Text>
          </Stack>
        </>
      ) : (
        <>
          {chatForOffer?.otherSide?.realLifeInfo?.image ? (
            <UserAvatar
              userImage={chatForOffer.otherSide.realLifeInfo.image}
              width={48}
              height={48}
              grayScale={negative ?? false}
            />
          ) : (
            <AnonymousAvatarFromSeed
              grayScale={negative ?? false}
              width={48}
              height={48}
              seed={offerInfo.offerId}
            />
          )}
          <Stack f={1} ml="$2">
            <UserNameWithSellingBuying
              offerInfo={offerInfo}
              userName={
                chatForOffer?.otherSide?.realLifeInfo?.userName ??
                randomName(offerInfo.offerId)
              }
            />
            <ContactTypeAndCommonNumber
              friendLevel={offerInfo.privatePart.friendLevel ?? []}
              numberOfCommonFriends={commonFriends.length}
            />
          </Stack>
        </>
      )}
    </>
  )
}

export default OfferAuthorAvatar
