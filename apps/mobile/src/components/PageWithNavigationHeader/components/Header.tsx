import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, Text, XStack} from 'tamagui'
import backButtonSvg from '../../../images/backButtonSvg'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import IconButton from '../../IconButton'
import closeSvg from '../../images/closeSvg'
import headerStateAtom from '../state/headerStateAtom'

function Header(): React.ReactElement | null {
  const headerState = useAtomValue(headerStateAtom)

  const onBackButtonPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
      if (headerState.goBack) {
        headerState.goBack()
      }
    })
  }, [headerState])

  const onCloseButtonPress = useCallback(() => {
    const onClose = headerState.onClose
    if (!onClose) return
    void dismissKeyboardAndResolveOnLayoutUpdate().then(onClose)
  }, [headerState])

  return !headerState.hidden && !headerState.hiddenAllTheWay ? (
    <XStack ai="center" jc="space-between" pb="$2">
      {headerState.goBack ? (
        <IconButton
          variant="primary"
          icon={backButtonSvg}
          onPress={onBackButtonPress}
        />
      ) : (
        <Stack w={40} />
      )}
      <Text fos={20} ff="$body600" col="$white">
        {headerState.title}
      </Text>
      {headerState.onClose ? (
        <IconButton icon={closeSvg} onPress={onCloseButtonPress} />
      ) : (
        <Stack w={40} />
      )}
    </XStack>
  ) : !headerState.hiddenAllTheWay ? (
    <Stack h={48} />
  ) : (
    <></>
  )
}

export default Header
