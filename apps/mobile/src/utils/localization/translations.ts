import {unflatten} from 'flat'

import base from '@vexl-next/localization/base.json'
import privacyPolicyDev from '@vexl-next/localization/privacyPolicy.json'
import termsOfUse from '@vexl-next/localization/termsOfUse.json'

import csBase from '@vexl-next/localization/cs-base.json'
import csPrivacyPolicyDev from '@vexl-next/localization/cs-privacyPolicy.json'
import csTermsOfUse from '@vexl-next/localization/cs-termsOfUse.json'

import deBase from '@vexl-next/localization/de-base.json'
import dePrivacyPolicyDev from '@vexl-next/localization/de-privacyPolicy.json'
import deTermsOfUse from '@vexl-next/localization/de-termsOfUse.json'

import enBase from '@vexl-next/localization/en-base.json'
import enPrivacyPolicyDev from '@vexl-next/localization/en-privacyPolicy.json'
import enTermsOfUse from '@vexl-next/localization/en-termsOfUse.json'

import frBase from '@vexl-next/localization/fr-base.json'
import frPrivacyPolicyDev from '@vexl-next/localization/fr-privacyPolicy.json'
import frTermsOfUse from '@vexl-next/localization/fr-termsOfUse.json'

import itBase from '@vexl-next/localization/it-base.json'
import itPrivacyPolicyDev from '@vexl-next/localization/it-privacyPolicy.json'
import itTermsOfUse from '@vexl-next/localization/it-termsOfUse.json'

import ptBase from '@vexl-next/localization/pt-base.json'
import ptPrivacyPolicyDev from '@vexl-next/localization/pt-privacyPolicy.json'
import ptTermsOfUse from '@vexl-next/localization/pt-termsOfUse.json'

import esBase from '@vexl-next/localization/es-base.json'
import esPrivacyPolicyDev from '@vexl-next/localization/es-privacyPolicy.json'
import esTermsOfUse from '@vexl-next/localization/es-termsOfUse.json'

import skBase from '@vexl-next/localization/sk-base.json'
import skPrivacyPolicyDev from '@vexl-next/localization/sk-privacyPolicy.json'
import skTermsOfUse from '@vexl-next/localization/sk-termsOfUse.json'

export const dev = {
  localeName: 'en_dev',
  ...unflatten<typeof base, typeof base>(base),
  termsOfUseMD: termsOfUse.text,
  privacyPolicyMD: privacyPolicyDev.text,
} as const

export const cs = {
  localeName: 'cs',
  ...unflatten<typeof csBase, typeof base>(csBase),
  termsOfUseMD: csTermsOfUse.text,
  privacyPolicyMD: csPrivacyPolicyDev.text,
} as const

export const de = {
  localeName: 'de',
  ...unflatten<typeof deBase, typeof base>(deBase),
  termsOfUseMD: deTermsOfUse.text,
  privacyPolicyMD: dePrivacyPolicyDev.text,
} as const

export const en = {
  localeName: 'en',
  ...unflatten<typeof enBase, typeof base>(enBase),
  termsOfUseMD: enTermsOfUse.text,
  privacyPolicyMD: enPrivacyPolicyDev.text,
} as const

export const fr = {
  localeName: 'fr',
  ...unflatten<typeof frBase, typeof base>(frBase),
  termsOfUseMD: frTermsOfUse.text,
  privacyPolicyMD: frPrivacyPolicyDev.text,
} as const

export const it = {
  localeName: 'it',
  ...unflatten<typeof itBase, typeof base>(itBase),
  termsOfUseMD: itTermsOfUse.text,
  privacyPolicyMD: itPrivacyPolicyDev.text,
} as const

export const pt = {
  localeName: 'pt',
  ...unflatten<typeof ptBase, typeof base>(ptBase),
  termsOfUseMD: ptTermsOfUse.text,
  privacyPolicyMD: ptPrivacyPolicyDev.text,
} as const

export const es = {
  localeName: 'es',
  ...unflatten<typeof esBase, typeof base>(esBase),
  termsOfUseMD: esTermsOfUse.text,
  privacyPolicyMD: esPrivacyPolicyDev.text,
} as const

export const sk = {
  ...unflatten<typeof skBase, typeof base>(skBase),
  localeName: 'sk',
  termsOfUseMD: skTermsOfUse.text,
  privacyPolicyMD: skPrivacyPolicyDev.text,
} as const
