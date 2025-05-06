import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import OfferWithBubbleTip from '../../OfferWithBubbleTip'
import Section from '../../Section'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import summarySvg from '../images/summarySvg'
import ScreenWrapper from './ScreenWrapper'

function SummaryScreen(): JSX.Element {
  const {t} = useTranslation()
  const {offerAtom, selectedClubsUuidsAtom} = useMolecule(offerFormMolecule)
  const clubs = useAtomValue(selectedClubsUuidsAtom)
  const offer = useAtomValue(offerAtom)

  // We need to merge clubs otherwhise they are not shown. Consider moving to molecule
  // If more cases like these appear
  const offerToDisplay = useMemo(() => {
    // We need to remove adminId for displaying purposes only
    // as the component below displays how the offer will be shown to THE USER ON THE OTHER SIDE!
    const {adminId, ...restOfPrivatePart} = offer.offerInfo.privatePart
    return {
      ...offer,
      offerInfo: {
        ...offer.offerInfo,
        privatePart: {
          ...restOfPrivatePart,
          clubIds: clubs,
        },
      },
    }
  }, [offer, clubs])

  return (
    <ScreenWrapper>
      <Section image={summarySvg} title={t('offerForm.summary')}>
        <Stack>
          <Text ff="$body500" mb="$4" col="$white" fos={16}>
            {t('offerForm.summaryDescription')}
          </Text>
          <OfferWithBubbleTip
            displayAsPreview
            reduceDescriptionLength
            offer={offerToDisplay}
          />
        </Stack>
      </Section>
    </ScreenWrapper>
  )
}

export default SummaryScreen
