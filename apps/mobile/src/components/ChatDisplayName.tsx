import {Text} from 'tamagui'
import React, {useMemo} from 'react'
import randomName from '../utils/randomName'
import {
  type Chat,
  type ChatOrigin,
} from '@vexl-next/domain/dist/general/messaging'
import {useTranslation} from '../utils/localization/I18nProvider'
import {type OfferType} from '@vexl-next/domain/dist/general/offers'
import {type Atom, useAtomValue} from 'jotai'
import {offerForChatOriginAtom} from '../state/marketplace/atom'

function AfterNameText({
  offerType,
  chatOrigin,
}: {
  offerType?: OfferType
  chatOrigin?: ChatOrigin
}): JSX.Element {
  const {t} = useTranslation()

  const basicProps = {
    fs: 16,
    ff: '$body600',
  }

  if (!chatOrigin || !offerType || chatOrigin.type === 'unknown') {
    return (
      <Text color="$greyOnBlack" {...basicProps}>
        {t('messages.offerDeleted')}
      </Text>
    )
  }

  if (chatOrigin.type === 'myOffer') {
    if (offerType === 'SELL') {
      return (
        <Text color="$pink" {...basicProps}>
          {t('messages.isBuying')}
        </Text>
      )
    } else {
      return (
        <Text color="$pastelGreen" {...basicProps}>
          {t('messages.isSelling')}
        </Text>
      )
    }
  } else {
    if (offerType === 'BUY') {
      return (
        <Text color="$pink" {...basicProps}>
          {t('messages.isSelling')}
        </Text>
      )
    } else {
      return (
        <Text color="$pastelGreen" {...basicProps}>
          {t('messages.isBuying')}
        </Text>
      )
    }
  }
}

function ChatDisplayName({
  chatAtom,
  center,
}: {
  chatAtom: Atom<Chat>
  center?: boolean
}): JSX.Element {
  const chat = useAtomValue(chatAtom)
  const chatRandomName = useMemo(() => randomName(chat.id), [chat.id])

  const originOffer = useAtomValue(
    useMemo(() => offerForChatOriginAtom(chat.origin), [chat.origin])
  )

  return (
    <Text
      textAlign={center ? 'center' : 'left'}
      fos={16}
      color="$white"
      ff="$body600"
    >
      {chatRandomName}{' '}
      <AfterNameText
        offerType={originOffer?.offerInfo.publicPart.offerType}
        chatOrigin={chat.origin}
      />
    </Text>
  )
}

export default ChatDisplayName
