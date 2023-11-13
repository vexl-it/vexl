import {Stack, Text, XStack} from 'tamagui'
import IconButton from '../../IconButton'
import backButtonSvg from '../../../images/backButtonSvg'
import closeSvg from '../../images/closeSvg'
import React from 'react'
import {useAtomValue} from 'jotai/index'
import headerStateAtom from '../state/headerStateAtom'

function Header(): JSX.Element | null {
  const headerState = useAtomValue(headerStateAtom)

  return !headerState.hidden ? (
    <XStack ai={'center'} jc={'space-between'} pb={'$2'}>
      <IconButton
        variant={'primary'}
        icon={backButtonSvg}
        onPress={headerState.goBack}
      />
      <Text fos={20} ff={'$body600'} col={'$white'}>
        {headerState.title}
      </Text>
      <IconButton icon={closeSvg} onPress={headerState.onClose} />
    </XStack>
  ) : (
    <Stack h={48} />
  )
}

export default Header
