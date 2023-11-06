import dev from '@vexl-next/localization-next/base.json'
import privacyPolicyDev from '@vexl-next/localization-next/privacyPolicy.json'
import termsOfUse from '@vexl-next/localization-next/termsOfUse.json'

export const enDev = {
  ...dev,
  termsOfUseMD: termsOfUse,
  privacyPolicyMD: privacyPolicyDev,
} as const
