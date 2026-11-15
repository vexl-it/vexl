import {
  CheckboxFilled,
  SquareOutline,
  Typography,
  XStack,
  useTheme,
} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

export default function DontShowAgainCheckbox({
  checked,
  onChange,
}: {
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <TouchableOpacity
      onPress={() => {
        onChange(!checked)
      }}
    >
      <XStack gap="$2" alignItems="center">
        {checked ? (
          <CheckboxFilled
            size={18}
            color={theme.accentHighlightSecondary.get()}
          />
        ) : (
          <SquareOutline size={18} color={theme.foregroundSecondary.get()} />
        )}
        <Typography variant="micro" color="$foregroundSecondary">
          {t('common.dontShowMeThisAgain')}
        </Typography>
      </XStack>
    </TouchableOpacity>
  )
}
