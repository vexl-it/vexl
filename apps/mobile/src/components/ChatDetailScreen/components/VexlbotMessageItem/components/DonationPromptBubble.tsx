import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../../../../navigationTypes'
import {myDonationsAtom} from '../../../../../state/donations/atom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {hasRecentDonation} from '../../../../DonationPrompt/atoms/stateAtoms'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'

export default function DonationPromptBubble(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {donationPromptAfterMessageIdAtom} = useMolecule(chatMolecule)
  const setDonationPromptAfterMessageId = useSetAtom(
    donationPromptAfterMessageIdAtom
  )
  const donatedRecently = hasRecentDonation(useAtomValue(myDonationsAtom))

  if (donatedRecently) return null

  return (
    <VexlbotActionCard
      mt="$2"
      title={t('donationPrompt.giveLove')}
      description={t('donationPrompt.ifYouLikeVexlSupportItsImprovement')}
      buttonText={t('donationPrompt.donate')}
      onPress={() => {
        navigation.navigate('DonationsFlow', {screen: 'SetDonation'})
      }}
      onClosePress={() => {
        setDonationPromptAfterMessageId(undefined)
      }}
    />
  )
}
