import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text} from 'tamagui'
import {useChatForOffer} from '../state/chat/hooks/useChatForOffer'
import createImportedContactsForHashesAtom from '../state/contacts/atom/createImportedContactsForHashesAtom'
import {userDataRealOrAnonymizedAtom} from '../state/session/userDataAtoms'
import {useTranslation} from '../utils/localization/I18nProvider'
import {goldenAvatarTypeAtom} from '../utils/preferences'
import randomName from '../utils/randomName'
import {randomSeedFromOfferInfo} from '../utils/RandomSeed'
import {setTimezoneOfUser} from '../utils/unixMillisecondsToLocaleDateTime'
import {AnonymousAvatarFromSeed} from './AnonymousAvatar'
import ContactTypeAndCommonNumber from './ContactTypeAndCommonNumber'
import {showGoldenAvatarInfoModalActionAton} from './GoldenAvatar/atoms'
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
  const goldenAvatarType = useAtomValue(goldenAvatarTypeAtom)
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
  const showGoldenAvatarInfoModal = useSetAtom(
    showGoldenAvatarInfoModalActionAton
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
          seed={randomSeedFromOfferInfo(offerInfo)}
          goldenAvatarType={goldenAvatarType}
        />
        <Stack flex={1} marginLeft="$2">
          <UserNameWithSellingBuying
            offerInfo={offerInfo}
            userName={
              chatForOffer?.otherSide?.realLifeInfo?.userName ??
              randomName(randomSeedFromOfferInfo(offerInfo))
            }
          />
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
            <TouchableOpacity
              disabled={!offerInfo.publicPart.goldenAvatarType}
              onPress={showGoldenAvatarInfoModal}
            >
              <AnonymousAvatarFromSeed
                grayScale={negative ?? false}
                width={48}
                height={48}
                seed={randomSeedFromOfferInfo(offerInfo)}
                goldenAvatarType={offerInfo.publicPart.goldenAvatarType}
              />
            </TouchableOpacity>
          )}
          <Stack f={1} ml="$2">
            <UserNameWithSellingBuying
              offerInfo={offerInfo}
              userName={
                chatForOffer?.otherSide?.realLifeInfo?.userName ??
                randomName(randomSeedFromOfferInfo(offerInfo))
              }
            />
            <ContactTypeAndCommonNumber
              contactsHashes={offerInfo.privatePart.commonFriends}
              friendLevel={offerInfo.privatePart.friendLevel ?? []}
              numberOfCommonFriends={commonFriends.length}
              clubsIds={offerInfo.privatePart.clubIds}
            />
          </Stack>
        </>
      )}
    </>
  )
}

export default OfferAuthorAvatar
