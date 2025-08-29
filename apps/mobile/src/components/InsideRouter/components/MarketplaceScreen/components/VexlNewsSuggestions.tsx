import {type VexlBotNews} from '@vexl-next/rest-api/src/services/content/contracts'
import {Option} from 'effect'
import {atom, useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {YStack, type YStackProps} from 'tamagui'
import openUrl from '../../../../../utils/openUrl'
import {
  announcmentsAtom,
  createIsVisibleIdAtom,
} from '../../../../FullscreenWarningScreen/state'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

function Item({data}: {data: VexlBotNews}): React.ReactElement {
  const closedStateAtom = useMemo(() => {
    if (!data.cancelable) return atom(true)

    return createIsVisibleIdAtom(data.id, !data.cancelForever)
  }, [data.id, data.cancelForever, data.cancelable])

  return (
    <MarketplaceSuggestion
      type={data.type}
      buttonText={Option.getOrUndefined(data.action)?.text}
      onButtonPress={() => {
        if (Option.isSome(data.action)) openUrl(data.action.value.url)()
      }}
      origin={Option.getOrUndefined(data.bubbleOrigin)}
      text={data.content}
      hideCloseButton={!data.cancelable}
      visibleStateAtom={closedStateAtom}
    />
  )
}

function VexlNewsSuggestions(props: YStackProps): React.ReactElement {
  const newsAndAnnouncements = useAtomValue(announcmentsAtom)

  if (Option.isNone(newsAndAnnouncements)) return <></>

  return (
    <YStack {...props} gap="$6">
      {newsAndAnnouncements.value.map((item) => (
        <Item key={item.id} data={item} />
      ))}
    </YStack>
  )
}

export default VexlNewsSuggestions
