import {FlashList} from '@shopify/flash-list'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ChevronLeft,
  EditRow,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {useAtom, useStore} from 'jotai'
import React, {memo, useCallback, useMemo} from 'react'
import {Modal} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, Stack} from 'tamagui'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import ContactPictureImage from '../ContactPictureImage'
import SvgImage from '../Image'
import picturePlaceholderSvg from '../images/picturePlaceholderSvg'
import {commonFriendsModalDataAtom} from './atoms'

const GREY_COLOR = getTokens().color.grey.val

function FriendListItem({
  friend,
}: {
  readonly friend: StoredContactWithComputedValues
}): React.ReactElement {
  const internationalNumber = parsePhoneNumber(
    friend.computedValues.normalizedNumber
  ).number?.international

  return (
    <EditRow
      state="profile"
      headline={friend.info.name}
      overline={internationalNumber ?? friend.computedValues.normalizedNumber}
      showEditButton={false}
      avatar={{
        children: (
          <ContactPictureImage
            width={40}
            height={40}
            objectFit="cover"
            contactId={friend.info.nonUniqueContactId}
            fallback={
              <SvgImage
                width={40}
                height={40}
                source={picturePlaceholderSvg}
                fill={GREY_COLOR}
              />
            }
          />
        ),
      }}
    />
  )
}

const MemoizedFriendListItem = memo(FriendListItem)

function ItemSeparator(): React.ReactElement {
  return <Stack height={8} />
}

function keyExtractor(
  item: StoredContactWithComputedValues
): HashedPhoneNumber {
  return item.computedValues.hash
}

function ListHeader(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Typography
      variant="description"
      color="$foregroundPrimary"
      marginBottom="$5"
    >
      {`${t('offer.youSeeThisOfferBecause')} ${t('offer.dontForgetToVerifyTheIdentity')}`}
    </Typography>
  )
}

function CommonFriendsModalContent({
  contactsHashes,
  onClose,
}: {
  readonly contactsHashes: readonly HashedPhoneNumber[]
  readonly onClose: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const {bottom} = useSafeAreaInsets()
  const store = useStore()

  const commonFriends = useMemo(
    () => store.get(createImportedContactsForHashesAtom(contactsHashes)),
    [contactsHashes, store]
  )

  const renderItem = useCallback(
    ({item}: {item: StoredContactWithComputedValues}) => (
      <MemoizedFriendListItem friend={item} />
    ),
    []
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('commonFriends.commonFriends')}
          leftAction={{icon: ChevronLeft, onPress: onClose}}
          rightActions={[{icon: XmarkCancelClose, onPress: onClose}]}
        />
      }
    >
      <FlashList
        data={commonFriends}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: bottom}}
      />
    </Screen>
  )
}

function CommonFriendsModal(): React.ReactElement | null {
  const [data, setData] = useAtom(commonFriendsModalDataAtom)

  const handleClose = useCallback(() => {
    setData(null)
  }, [setData])

  return (
    <Modal
      visible={data != null}
      animationType="slide"
      onRequestClose={handleClose}
    >
      {data != null && (
        <CommonFriendsModalContent
          contactsHashes={data}
          onClose={handleClose}
        />
      )}
    </Modal>
  )
}

export default CommonFriendsModal
