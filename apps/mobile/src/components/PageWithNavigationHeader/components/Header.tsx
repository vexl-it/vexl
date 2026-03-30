import {ChevronLeft, NavButton, Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, XStack} from 'tamagui'
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
    <XStack ai="center" jc="space-between" pb="$4">
      {headerState.goBack ? (
        <NavButton
          icon={ChevronLeft}
          onPress={onBackButtonPress}
          variant="highlighted"
        />
      ) : (
        <Stack w={40} />
      )}
      <Typography color="$foregroundPrimary" variant="titlesSmall">
        {headerState.title}
      </Typography>
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
