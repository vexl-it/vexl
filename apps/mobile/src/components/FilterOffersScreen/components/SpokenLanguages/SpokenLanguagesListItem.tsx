import {type SetStateAction, type WritableAtom, useAtom} from 'jotai'
import {type SpokenLanguage} from '@vexl-next/domain/dist/general/offers'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Text, XStack} from 'tamagui'
import Image from '../../../Image'
import checkmarkSvg from '../../../images/checkmarkSvg'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

interface Props {
  createIsThisLanguageSelectedAtom: (
    spokenLanguage: SpokenLanguage
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
  spokenLanguage: SpokenLanguage
}

function SpokenLanguagesListItem({
  createIsThisLanguageSelectedAtom,
  spokenLanguage,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const [isSelected, select] = useAtom(
    useMemo(
      () => createIsThisLanguageSelectedAtom(spokenLanguage),
      [createIsThisLanguageSelectedAtom, spokenLanguage]
    )
  )

  return (
    <TouchableOpacity
      onPress={() => {
        select(!isSelected)
      }}
    >
      <XStack ai={'center'} jc={'space-between'} px={'$2'} py={'$4'}>
        <Text col={'$white'} fos={18}>
          {t(`offerForm.spokenLanguages.${spokenLanguage}`)}
        </Text>
        {isSelected && (
          <Image
            height={18}
            width={18}
            source={checkmarkSvg}
            stroke={tokens.color.$greyAccent5.val}
          />
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default SpokenLanguagesListItem
