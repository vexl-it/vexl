import base from '@vexl-next/localization/base.json'
import bgBase from '@vexl-next/localization/bg-base.json'
import bgPrivacyPolicyDev from '@vexl-next/localization/bg-privacyPolicy.json'
import bgTermsOfUse from '@vexl-next/localization/bg-termsOfUse.json'
import csBase from '@vexl-next/localization/cs-base.json'
import csPrivacyPolicyDev from '@vexl-next/localization/cs-privacyPolicy.json'
import csTermsOfUse from '@vexl-next/localization/cs-termsOfUse.json'
import deBase from '@vexl-next/localization/de-base.json'
import dePrivacyPolicyDev from '@vexl-next/localization/de-privacyPolicy.json'
import deTermsOfUse from '@vexl-next/localization/de-termsOfUse.json'
import enBase from '@vexl-next/localization/en-base.json'
import enPrivacyPolicyDev from '@vexl-next/localization/en-privacyPolicy.json'
import enTermsOfUse from '@vexl-next/localization/en-termsOfUse.json'
import esBase from '@vexl-next/localization/es-base.json'
import esPrivacyPolicyDev from '@vexl-next/localization/es-privacyPolicy.json'
import esTermsOfUse from '@vexl-next/localization/es-termsOfUse.json'
import frBase from '@vexl-next/localization/fr-base.json'
import frPrivacyPolicyDev from '@vexl-next/localization/fr-privacyPolicy.json'
import frTermsOfUse from '@vexl-next/localization/fr-termsOfUse.json'
import itBase from '@vexl-next/localization/it-base.json'
import itPrivacyPolicyDev from '@vexl-next/localization/it-privacyPolicy.json'
import itTermsOfUse from '@vexl-next/localization/it-termsOfUse.json'
import jaBase from '@vexl-next/localization/ja-base.json'
import jaPrivacyPolicyDev from '@vexl-next/localization/ja-privacyPolicy.json'
import jaTermsOfUse from '@vexl-next/localization/ja-termsOfUse.json'
import plBase from '@vexl-next/localization/pl-base.json'
import plPrivacyPolicyDev from '@vexl-next/localization/pl-privacyPolicy.json'
import plTermsOfUse from '@vexl-next/localization/pl-termsOfUse.json'
import privacyPolicyDev from '@vexl-next/localization/privacyPolicy.json'
import ptBase from '@vexl-next/localization/pt-base.json'
import ptPrivacyPolicyDev from '@vexl-next/localization/pt-privacyPolicy.json'
import ptTermsOfUse from '@vexl-next/localization/pt-termsOfUse.json'
import skBase from '@vexl-next/localization/sk-base.json'
import skPrivacyPolicyDev from '@vexl-next/localization/sk-privacyPolicy.json'
import skTermsOfUse from '@vexl-next/localization/sk-termsOfUse.json'
import termsOfUse from '@vexl-next/localization/termsOfUse.json'
import {unflatten} from 'flat'

export const dev = {
  localeName: 'en_dev',
  ...unflatten<typeof base, typeof base>(base),
  termsOfUseMD: termsOfUse.termsOfUseText,
  privacyPolicyMD: privacyPolicyDev.privacyPolicyText,
} as const

export const cs = {
  flag: '🇨🇿',
  localeName: 'cs',
  ...unflatten<typeof csBase, typeof base>(csBase),
  termsOfUseMD: csTermsOfUse.termsOfUseText,
  privacyPolicyMD: csPrivacyPolicyDev.privacyPolicyText,
} as const

export const de = {
  flag: '🇩🇪',
  localeName: 'de',
  ...unflatten<typeof deBase, typeof base>(deBase),
  termsOfUseMD: deTermsOfUse.termsOfUseText,
  privacyPolicyMD: dePrivacyPolicyDev.privacyPolicyText,
} as const

export const en = {
  flag: '🇬🇧',
  localeName: 'en',
  ...unflatten<typeof enBase, typeof base>(enBase),
  termsOfUseMD: enTermsOfUse.termsOfUseText,
  privacyPolicyMD: enPrivacyPolicyDev.privacyPolicyText,
} as const

export const fr = {
  flag: '🇫🇷',
  localeName: 'fr',
  ...unflatten<typeof frBase, typeof base>(frBase),
  termsOfUseMD: frTermsOfUse.termsOfUseText,
  privacyPolicyMD: frPrivacyPolicyDev.privacyPolicyText,
} as const

export const it = {
  flag: '🇮🇹',
  localeName: 'it',
  ...unflatten<typeof itBase, typeof base>(itBase),
  termsOfUseMD: itTermsOfUse.termsOfUseText,
  privacyPolicyMD: itPrivacyPolicyDev.privacyPolicyText,
} as const

export const pt = {
  flag: '🇵🇹',
  localeName: 'pt',
  ...unflatten<typeof ptBase, typeof base>(ptBase),
  termsOfUseMD: ptTermsOfUse.termsOfUseText,
  privacyPolicyMD: ptPrivacyPolicyDev.privacyPolicyText,
} as const

export const pl = {
  flag: '🇵🇱',
  localeName: 'pl',
  ...unflatten<typeof plBase, typeof base>(plBase),
  termsOfUseMD: plTermsOfUse.termsOfUseText,
  privacyPolicyMD: plPrivacyPolicyDev.privacyPolicyText,
} as const

export const es = {
  flag: '🇪🇸',
  localeName: 'es',
  ...unflatten<typeof esBase, typeof base>(esBase),
  termsOfUseMD: esTermsOfUse.termsOfUseText,
  privacyPolicyMD: esPrivacyPolicyDev.privacyPolicyText,
} as const

export const sk = {
  flag: '🇸🇰',
  ...unflatten<typeof skBase, typeof base>(skBase),
  localeName: 'sk',
  termsOfUseMD: skTermsOfUse.termsOfUseText,
  privacyPolicyMD: skPrivacyPolicyDev.privacyPolicyText,
} as const

export const bg = {
  flag: '🇧🇬',
  ...unflatten<typeof bgBase, typeof base>(bgBase),
  localeName: 'bg',
  termsOfUseMD: bgTermsOfUse.termsOfUseText,
  privacyPolicyMD: bgPrivacyPolicyDev.privacyPolicyText,
} as const

export const ja = {
  flag: '🇯🇵',
  ...unflatten<typeof jaBase, typeof base>(jaBase),
  localeName: 'ja',
  termsOfUseMD: jaTermsOfUse.termsOfUseText,
  privacyPolicyMD: jaPrivacyPolicyDev.privacyPolicyText,
} as const
