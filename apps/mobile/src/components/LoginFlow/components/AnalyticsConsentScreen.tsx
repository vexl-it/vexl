import {useSetAtom} from 'jotai'
import React from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {reportFirstOpenActionAtom} from '../../../utils/analytics'
import AnalyticsConsent from '../../AnalyticsConsent'

type Props = LoginFlowStackScreenProps<'AnalyticsConsent'>

export default function AnalyticsConsentScreen({
  navigation,
}: Props): React.ReactElement {
  const reportFirstOpen = useSetAtom(reportFirstOpenActionAtom)

  return (
    <AnalyticsConsent
      onAnswered={() => {
        reportFirstOpen()
        navigation.navigate('Intro2')
      }}
    />
  )
}
