import {AnonymousAvatarFromSeed} from './AnonymousAvatar'
import {Stack, Text} from 'tamagui'
import UserNameWithSellingBuying from './UserNameWithSellingBuying'
import randomName from '../utils/randomName'
import ContactTypeAndCommonNumber from './ContactTypeAndCommonNumber'
import {useChatForOffer} from '../state/chat/hooks/useChatForOffer'
import {type OneOfferInState} from '../state/marketplace/domain'
import UserAvatar from './UserAvatar'
import {DateTime} from 'luxon'
import {userDataAtom} from '../state/session'
import {useTranslation} from '../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {selectImportedContactsWithHashes} from '../state/contacts'

function OfferAuthorAvatar({
  offer: {offerInfo, ownershipInfo},
  negative,
}: {
  offer: OneOfferInState
  negative: boolean
}): JSX.Element {
  const chatForOffer = useChatForOffer({
    offerPublicKey: offerInfo.publicPart.offerPublicKey,
  })
  const userData = useAtomValue(userDataAtom)
  const {t} = useTranslation()
  const commonFriends = useAtomValue(
    useMemo(
      () =>
        selectImportedContactsWithHashes(offerInfo.privatePart.commonFriends),
      [offerInfo.privatePart.commonFriends]
    )
  )

  return (
    <>
      {ownershipInfo ? (
        <>
          <UserAvatar width={48} height={48} userImage={userData.image} />
          <Stack f={1} ml={'$2'}>
            <Text fos={16} ff={'$body600'} col={'$white'}>
              {t('myOffers.myOffer')}
            </Text>
            <Text fos={12} ff={'$body500'} col={'$greyOnBlack'}>
              {t('myOffers.offerAdded', {
                date: DateTime.fromISO(offerInfo.createdAt).toLocaleString(
                  DateTime.DATE_FULL
                ),
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
              offerInfo={{
                offerType: offerInfo.publicPart.offerType,
                offerDirection: ownershipInfo ? 'myOffer' : 'theirOffer',
              }}
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
