import {Array} from 'effect'
import {type PrimitiveAtom, useAtom} from 'jotai'
import {useMemo} from 'react'
import {Text, YStack} from 'tamagui'
import {Dropdown} from '../../../../components/Dropdown'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type ClubWithMembers} from '../../domain'

export function SelectClubComponent({
  clubs,
  selectedClubAtom,
}: {
  clubs: Array.NonEmptyReadonlyArray<ClubWithMembers>
  selectedClubAtom: PrimitiveAtom<ClubWithMembers>
}): JSX.Element {
  const [selectedClub, setSelectedClub] = useAtom(selectedClubAtom)
  const {t} = useTranslation()

  const clubsDropdownItems = useMemo(
    () =>
      Array.map(clubs, (one) => ({
        label: one.club.name,
        value: one,
      })),
    [clubs]
  )

  return (
    <YStack>
      <Text fos={24} col="$black" ff="$heading" mb="$2">
        {t('clubs.admition.selectClub.title')}
      </Text>
      <Text fos={18} col="$greyOnWhite" ff="$body500" mb="$4">
        {t('clubs.admition.selectClub.text')}
      </Text>
      <Dropdown
        data={clubsDropdownItems}
        value={{value: selectedClub, label: selectedClub.club.name}}
        onChange={(v) => {
          setSelectedClub(v.value)
        }}
      />
    </YStack>
  )
}
