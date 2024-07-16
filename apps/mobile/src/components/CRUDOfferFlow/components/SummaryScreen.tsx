import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import OfferWithBubbleTip from '../../OfferWithBubbleTip'
import Section from '../../Section'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import summarySvg from '../images/summarySvg'
import ScreenWrapper from './ScreenWrapper'

function SummaryScreen(): JSX.Element {
  const {t} = useTranslation()
  const {offerAtom} = useMolecule(offerFormMolecule)

  const offer = useAtomValue(offerAtom)

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
            offer={offer}
          />
        </Stack>
      </Section>
    </ScreenWrapper>
  )
}

export default SummaryScreen
