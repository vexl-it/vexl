import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, styled, XStack} from 'tamagui'
import backButtonSvg from '../../../../images/backButtonSvg'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../utils/dismissKeyboardPromise'
import IconButton from '../../../IconButton'
import headerStateAtom from '../../state/headerStateAtom'

const BackButtonFiller = styled(Stack, {
  h: 40,
  w: 40,
})

const ProgressBar = styled(Stack, {
  w: 24,
  h: 4,
  br: '$1',
  variants: {
    highlighted: {
      true: {
        bg: '$white',
      },
      false: {
        bg: '$greyAccent1',
      },
    },
  },
})

function Header(): React.ReactElement | null {
  const headerOptions = useAtomValue(headerStateAtom)
  const onPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(headerOptions.goBack)
  }, [headerOptions.goBack])

  if (headerOptions.hidden) return null

  return (
    <XStack jc="space-between" ai="center" mx="$2" pb="$4">
      {headerOptions.showBackButton ? (
        <IconButton icon={backButtonSvg} variant="dark" onPress={onPress} />
      ) : (
        <BackButtonFiller />
      )}
      {headerOptions.progressNumber !== undefined && (
        <XStack>
          <ProgressBar highlighted={(headerOptions.progressNumber ?? 0) >= 1} />
          <Stack w={4} />
          <ProgressBar highlighted={(headerOptions.progressNumber ?? 0) >= 2} />
          <Stack w={4} />
          <ProgressBar highlighted={(headerOptions.progressNumber ?? 0) >= 3} />
        </XStack>
      )}
    </XStack>
  )
}

export default Header
