import base from '@vexl-next/localization/base.json'
import bgBase from '@vexl-next/localization/bg-base.json'
import bgChildAbusePrevention from '@vexl-next/localization/bg-childSafetyAndSexAbusePrevention.json'
import bgPrivacyPolicyDev from '@vexl-next/localization/bg-privacyPolicy.json'
import bgTermsOfUse from '@vexl-next/localization/bg-termsOfUse.json'
import csBase from '@vexl-next/localization/cs-base.json'
import csChildAbusePrevention from '@vexl-next/localization/cs-childSafetyAndSexAbusePrevention.json'
import csPrivacyPolicyDev from '@vexl-next/localization/cs-privacyPolicy.json'
import csTermsOfUse from '@vexl-next/localization/cs-termsOfUse.json'
import deBase from '@vexl-next/localization/de-base.json'
import deChildAbusePrevention from '@vexl-next/localization/de-childSafetyAndSexAbusePrevention.json'
import dePrivacyPolicyDev from '@vexl-next/localization/de-privacyPolicy.json'
import deTermsOfUse from '@vexl-next/localization/de-termsOfUse.json'
import enBase from '@vexl-next/localization/en-base.json'
import enChildAbusePrevention from '@vexl-next/localization/en-childSafetyAndSexAbusePrevention.json'
import enPrivacyPolicyDev from '@vexl-next/localization/en-privacyPolicy.json'
import enTermsOfUse from '@vexl-next/localization/en-termsOfUse.json'
import esBase from '@vexl-next/localization/es-base.json'
import esChildAbusePrevention from '@vexl-next/localization/es-childSafetyAndSexAbusePrevention.json'
import esPrivacyPolicyDev from '@vexl-next/localization/es-privacyPolicy.json'
import esTermsOfUse from '@vexl-next/localization/es-termsOfUse.json'
import frBase from '@vexl-next/localization/fr-base.json'
import frChildAbusePrevention from '@vexl-next/localization/fr-childSafetyAndSexAbusePrevention.json'
import frPrivacyPolicyDev from '@vexl-next/localization/fr-privacyPolicy.json'
import frTermsOfUse from '@vexl-next/localization/fr-termsOfUse.json'
import itBase from '@vexl-next/localization/it-base.json'
import itChildAbusePrevention from '@vexl-next/localization/it-childSafetyAndSexAbusePrevention.json'
import itPrivacyPolicyDev from '@vexl-next/localization/it-privacyPolicy.json'
import itTermsOfUse from '@vexl-next/localization/it-termsOfUse.json'
import jaBase from '@vexl-next/localization/ja-base.json'
import jaChildAbusePrevention from '@vexl-next/localization/ja-childSafetyAndSexAbusePrevention.json'
import jaPrivacyPolicyDev from '@vexl-next/localization/ja-privacyPolicy.json'
import jaTermsOfUse from '@vexl-next/localization/ja-termsOfUse.json'
import nlBase from '@vexl-next/localization/nl-base.json'
import nlChildAbusePrevention from '@vexl-next/localization/nl-childSafetyAndSexAbusePrevention.json'
import nlPrivacyPolicyDev from '@vexl-next/localization/nl-privacyPolicy.json'
import nlTermsOfUse from '@vexl-next/localization/nl-termsOfUse.json'
import plBase from '@vexl-next/localization/pl-base.json'
import plChildAbusePrevention from '@vexl-next/localization/pl-childSafetyAndSexAbusePrevention.json'
import plPrivacyPolicyDev from '@vexl-next/localization/pl-privacyPolicy.json'
import plTermsOfUse from '@vexl-next/localization/pl-termsOfUse.json'
import privacyPolicyDev from '@vexl-next/localization/privacyPolicy.json'
import ptBase from '@vexl-next/localization/pt-base.json'
import ptChildAbusePrevention from '@vexl-next/localization/pt-childSafetyAndSexAbusePrevention.json'
import ptPrivacyPolicyDev from '@vexl-next/localization/pt-privacyPolicy.json'
import ptTermsOfUse from '@vexl-next/localization/pt-termsOfUse.json'
import skBase from '@vexl-next/localization/sk-base.json'
import skChildAbusePrevention from '@vexl-next/localization/sk-childSafetyAndSexAbusePrevention.json'
import skPrivacyPolicyDev from '@vexl-next/localization/sk-privacyPolicy.json'
import skTermsOfUse from '@vexl-next/localization/sk-termsOfUse.json'
import swBase from '@vexl-next/localization/sw-base.json'
import swChildAbusePrevention from '@vexl-next/localization/sw-childSafetyAndSexAbusePrevention.json'
import swPrivacyPolicyDev from '@vexl-next/localization/sw-privacyPolicy.json'
import swTermsOfUse from '@vexl-next/localization/sw-termsOfUse.json'
import termsOfUse from '@vexl-next/localization/termsOfUse.json'
import {unflatten} from 'flat'

export const dev = {
  localeName: 'en_dev',
  ...unflatten<typeof base, typeof base>(base),
  termsOfUseMD: termsOfUse.termsOfUseText,
  privacyPolicyMD: privacyPolicyDev.privacyPolicyText,
  childAbusePrevention: enChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const cs = {
  flag: '🇨🇿',
  localeName: 'cs',
  ...unflatten<typeof csBase, typeof base>(csBase),
  termsOfUseMD: csTermsOfUse.termsOfUseText,
  privacyPolicyMD: csPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: csChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const de = {
  flag: '🇩🇪',
  localeName: 'de',
  ...unflatten<typeof deBase, typeof base>(deBase),
  termsOfUseMD: deTermsOfUse.termsOfUseText,
  privacyPolicyMD: dePrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: deChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const en = {
  flag: '🇬🇧',
  localeName: 'en',
  ...unflatten<typeof enBase, typeof base>(enBase),
  termsOfUseMD: enTermsOfUse.termsOfUseText,
  privacyPolicyMD: enPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: enChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const fr = {
  flag: '🇫🇷',
  localeName: 'fr',
  ...unflatten<typeof frBase, typeof base>(frBase),
  termsOfUseMD: frTermsOfUse.termsOfUseText,
  privacyPolicyMD: frPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: frChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const it = {
  flag: '🇮🇹',
  localeName: 'it',
  ...unflatten<typeof itBase, typeof base>(itBase),
  termsOfUseMD: itTermsOfUse.termsOfUseText,
  privacyPolicyMD: itPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: itChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const pt = {
  flag: '🇵🇹',
  localeName: 'pt',
  ...unflatten<typeof ptBase, typeof base>(ptBase),
  termsOfUseMD: ptTermsOfUse.termsOfUseText,
  privacyPolicyMD: ptPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: ptChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const pl = {
  flag: '🇵🇱',
  localeName: 'pl',
  ...unflatten<typeof plBase, typeof base>(plBase),
  termsOfUseMD: plTermsOfUse.termsOfUseText,
  privacyPolicyMD: plPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: plChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const es = {
  flag: '🇪🇸',
  localeName: 'es',
  ...unflatten<typeof esBase, typeof base>(esBase),
  termsOfUseMD: esTermsOfUse.termsOfUseText,
  privacyPolicyMD: esPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: esChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const sk = {
  flag: '🇸🇰',
  ...unflatten<typeof skBase, typeof base>(skBase),
  localeName: 'sk',
  termsOfUseMD: skTermsOfUse.termsOfUseText,
  privacyPolicyMD: skPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: skChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const bg = {
  flag: '🇧🇬',
  ...unflatten<typeof bgBase, typeof base>(bgBase),
  localeName: 'bg',
  termsOfUseMD: bgTermsOfUse.termsOfUseText,
  privacyPolicyMD: bgPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: bgChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const ja = {
  flag: '🇯🇵',
  ...unflatten<typeof jaBase, typeof base>(jaBase),
  localeName: 'ja',
  termsOfUseMD: jaTermsOfUse.termsOfUseText,
  privacyPolicyMD: jaPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: jaChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const nl = {
  flag: '🇳🇱',
  ...unflatten<typeof nlBase, typeof base>(nlBase),
  localeName: 'nl',
  termsOfUseMD: nlTermsOfUse.termsOfUseText,
  privacyPolicyMD: nlPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: nlChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const

export const sw = {
  flag: '🇰🇪',
  ...unflatten<typeof swBase, typeof base>(swBase),
  localeName: 'sw',
  termsOfUseMD: swTermsOfUse.termsOfUseText,
  privacyPolicyMD: swPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: swChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const
