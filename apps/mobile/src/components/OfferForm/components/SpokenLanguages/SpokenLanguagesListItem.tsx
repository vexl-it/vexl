import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {useAtom, type SetStateAction, type WritableAtom} from 'jotai'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Text, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Image from '../../../Image'
import checkmarkSvg from '../../../images/checkmarkSvg'

interface Props {
  createIsThisLanguageSelectedAtom: (
    spokenLanguageAtom: SpokenLanguage
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
  spokenLanguage: SpokenLanguage
}

function SpokenLanguagesListItem({
  createIsThisLanguageSelectedAtom,
  spokenLanguage,
}: Props): React.ReactElement {
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
      <XStack ai="center" jc="space-between" px="$2" py="$4">
        <Text col="$white" fos={18}>
          {t(`offerForm.spokenLanguages.${spokenLanguage}`)}
        </Text>
        {!!isSelected && (
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
