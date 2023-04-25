import React from 'react'
import {type Atom, useAtomValue} from 'jotai'
import {chatTime, type MessagesListItem} from '../utils'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import BigIconMessage from './BigIconMessage'
import UserAvatar from '../../UserAvatar'
import TextMessage from './TextMessage'
import {Stack, Text} from 'tamagui'
import Image from '../../Image'
import BlockIconSvg from '../../../images/blockIconSvg'

function MessageItem({
  itemAtom,
}: {
  itemAtom: Atom<MessagesListItem>
}): JSX.Element | null {
  const item = useAtomValue(itemAtom)
  const {otherSideDataAtom} = useMolecule(chatMolecule)
  const {t} = useTranslation()
  const {userName, image} = useAtomValue(otherSideDataAtom)

  if (item.type === 'message') {
    if (
      item.message.state === 'received' &&
      item.message.message.messageType === 'INBOX_DELETED'
    ) {
      return (
        <BigIconMessage
          isLatest={item.isLatest}
          smallerText={t('messages.messagePreviews.incoming.INBOX_DELETED', {
            them: userName,
          })}
          icon={
            <Stack
              width={80}
              height={80}
              backgroundColor={'$darkRed'}
              alignItems="center"
              justifyContent={'center'}
              borderRadius={12}
            >
              <Image width={35} height={35} source={BlockIconSvg} />
            </Stack>
          }
        />
      )
    }

    const direction =
      item.message.state === 'received' ? 'incoming' : 'outgoing'

    if (item.message.message.messageType === 'DELETE_CHAT') {
      return (
        <BigIconMessage
          isLatest={item.isLatest}
          smallerText={t(`messages.messagePreviews.${direction}.DELETE_CHAT`, {
            them: userName,
          })}
          icon={
            <UserAvatar
              height={80}
              width={80}
              userImage={image}
              grayScale={true}
            />
          }
        />
      )
    }

    if (item.message.message.messageType === 'BLOCK_CHAT')
      return (
        <BigIconMessage
          isLatest={item.isLatest}
          smallerText={t(`messages.messagePreviews.${direction}.BLOCK_CHAT`, {
            them: userName,
          })}
          icon={
            <UserAvatar
              height={80}
              width={80}
              userImage={image}
              grayScale={true}
            />
          }
        />
      )

    return <TextMessage messageAtom={itemAtom} />
  }
  if (item.type === 'time')
    return (
      <Stack ai={'center'}>
        <Text color="$greyOnBlack">{chatTime(item.time)}</Text>
      </Stack>
    )
  if (item.type === 'space') return <Stack h={'$3'} />
  return null
}

export default React.memo(MessageItem)
