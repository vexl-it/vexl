import {Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {
  commitHashShort,
  nativeBuildNumber,
  nativeVersion,
  version,
  versionCode,
} from '../../../utils/environment'

function VersionInfo(): React.ReactElement {
  return (
    <YStack>
      <Typography
        textAlign="center"
        variant="description"
        color="$foregroundSecondary"
      >
        {nativeVersion} ({nativeBuildNumber})
      </Typography>
      <Typography
        textAlign="center"
        variant="description"
        color="$foregroundSecondary"
      >
        JS {version} ({versionCode}) · {commitHashShort}
      </Typography>
    </YStack>
  )
}

export default VersionInfo
