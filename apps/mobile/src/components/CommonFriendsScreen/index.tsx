import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {getTokens, Stack} from 'tamagui'
import Button from '../Button'
import React, {useMemo} from 'react'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import CommonFriendsListItem from './components/CommonFriendsListItem'
import {type ContactNormalizedWithHash} from '../../state/contacts/domain'
import {type RootStackScreenProps} from '../../navigationTypes'
import {selectImportedContactsWithHashes} from '../../state/contacts'
import {useStore} from 'jotai'
import {FlashList} from '@shopify/flash-list'

type Props = RootStackScreenProps<'CommonFriends'>

function keyExtractor(contact: ContactNormalizedWithHash): string {
  return contact.hash
}

function renderItem({item}: {item: ContactNormalizedWithHash}): JSX.Element {
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
    () => store.get(selectImportedContactsWithHashes(contactsHashes)),
    [contactsHashes, store]
  )

  return (
    <Screen customHorizontalPadding={16} bc={'$white'}>
      <Stack f={1} mb={'$2'}>
        <ScreenTitle
          text={t('commonFriends.commonFriends')}
          textColor={'$black'}
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
          variant={'secondary'}
          text={t('common.gotIt')}
        />
      </Stack>
    </Screen>
  )
}

export default CommonFriendsScreen
