import {FlashList} from '@shopify/flash-list'
import {useStore} from 'jotai'
import React, {useMemo} from 'react'
import {getTokens, Stack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import CommonFriendsListItem from './components/CommonFriendsListItem'

type Props = RootStackScreenProps<'CommonFriends'>

function keyExtractor(contact: StoredContactWithComputedValues): string {
  return contact.computedValues.hash
}

function renderItem({
  item,
}: {
  item: StoredContactWithComputedValues
}): JSX.Element {
  return <CommonFriendsListItem friend={item} />
}

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={16} />
}

function CommonFriendsScreen({
  route: {
    params: {contactsHashes},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const store = useStore()
  const safeGoBack = useSafeGoBack()
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()

  const commonFriends = useMemo(
    () => store.get(createImportedContactsForHashesAtom(contactsHashes)),
    [contactsHashes, store]
  )

  return (
    <Screen customHorizontalPadding={16} bc="$white">
      <Stack f={1} mb="$2">
        <ScreenTitle
          text={t('commonFriends.commonFriends')}
          textColor="$black"
        />
        <FlashList
          estimatedItemSize={64}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={useMemo(
            () => ({
              paddingHorizontal: getTokens().space[2].val,
              paddingBottom: bottomOffset + Number(getTokens().space[5].val),
            }),
            [bottomOffset]
          )}
          data={commonFriends}
          ItemSeparatorComponent={ItemSeparatorComponent}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
        <Button
          onPress={safeGoBack}
          variant="secondary"
          text={t('common.gotIt')}
        />
      </Stack>
    </Screen>
  )
}

export default CommonFriendsScreen
