import {useNavigation} from '@react-navigation/native'
import React from 'react'
import {type YStackProps} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {showCheckUpdatedPrivacyPolicySuggestionAtom} from '../../../../../utils/preferences'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

function CheckUpdatedPrivacyPolicySuggestion(
  props: YStackProps
): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <MarketplaceSuggestion
      buttonText={t('common.more')}
      onButtonPress={() => {
        navigation.navigate('TermsAndConditions', {activeTab: 'privacyPolicy'})
      }}
      text={t('suggestion.ourPrivacyPolicyJustGotUpdate')}
      visibleStateAtom={showCheckUpdatedPrivacyPolicySuggestionAtom}
      {...props}
    />
  )
}

export default CheckUpdatedPrivacyPolicySuggestion
