import {unflatten} from 'flat'
import base from '../base.json'
import bgBase from '../bg-base.json'
import bgChildAbusePrevention from '../bg-childSafetyAndSexAbusePrevention.json'
import bgPrivacyPolicyDev from '../bg-privacyPolicy.json'
import bgTermsOfUse from '../bg-termsOfUse.json'
import csBase from '../cs-base.json'
import csChildAbusePrevention from '../cs-childSafetyAndSexAbusePrevention.json'
import csPrivacyPolicyDev from '../cs-privacyPolicy.json'
import csTermsOfUse from '../cs-termsOfUse.json'
import deBase from '../de-base.json'
import deChildAbusePrevention from '../de-childSafetyAndSexAbusePrevention.json'
import dePrivacyPolicyDev from '../de-privacyPolicy.json'
import deTermsOfUse from '../de-termsOfUse.json'
import enBase from '../en-base.json'
import enChildAbusePrevention from '../en-childSafetyAndSexAbusePrevention.json'
import enPrivacyPolicyDev from '../en-privacyPolicy.json'
import enTermsOfUse from '../en-termsOfUse.json'
import esBase from '../es-base.json'
import esChildAbusePrevention from '../es-childSafetyAndSexAbusePrevention.json'
import esPrivacyPolicyDev from '../es-privacyPolicy.json'
import esTermsOfUse from '../es-termsOfUse.json'
import frBase from '../fr-base.json'
import frChildAbusePrevention from '../fr-childSafetyAndSexAbusePrevention.json'
import frPrivacyPolicyDev from '../fr-privacyPolicy.json'
import frTermsOfUse from '../fr-termsOfUse.json'
import itBase from '../it-base.json'
import itChildAbusePrevention from '../it-childSafetyAndSexAbusePrevention.json'
import itPrivacyPolicyDev from '../it-privacyPolicy.json'
import itTermsOfUse from '../it-termsOfUse.json'
import jaBase from '../ja-base.json'
import jaChildAbusePrevention from '../ja-childSafetyAndSexAbusePrevention.json'
import jaPrivacyPolicyDev from '../ja-privacyPolicy.json'
import jaTermsOfUse from '../ja-termsOfUse.json'
import nlBase from '../nl-base.json'
import nlChildAbusePrevention from '../nl-childSafetyAndSexAbusePrevention.json'
import nlPrivacyPolicyDev from '../nl-privacyPolicy.json'
import nlTermsOfUse from '../nl-termsOfUse.json'
import plBase from '../pl-base.json'
import plChildAbusePrevention from '../pl-childSafetyAndSexAbusePrevention.json'
import plPrivacyPolicyDev from '../pl-privacyPolicy.json'
import plTermsOfUse from '../pl-termsOfUse.json'
import privacyPolicyDev from '../privacyPolicy.json'
import ptBase from '../pt-base.json'
import ptChildAbusePrevention from '../pt-childSafetyAndSexAbusePrevention.json'
import ptPrivacyPolicyDev from '../pt-privacyPolicy.json'
import ptTermsOfUse from '../pt-termsOfUse.json'
import skBase from '../sk-base.json'
import skChildAbusePrevention from '../sk-childSafetyAndSexAbusePrevention.json'
import skPrivacyPolicyDev from '../sk-privacyPolicy.json'
import skTermsOfUse from '../sk-termsOfUse.json'
import swBase from '../sw-base.json'
import swChildAbusePrevention from '../sw-childSafetyAndSexAbusePrevention.json'
import swPrivacyPolicyDev from '../sw-privacyPolicy.json'
import swTermsOfUse from '../sw-termsOfUse.json'
import termsOfUse from '../termsOfUse.json'
import zhBase from '../zh-base.json'
import zhChildAbusePrevention from '../zh-childSafetyAndSexAbusePrevention.json'
import zhPrivacyPolicyDev from '../zh-privacyPolicy.json'
import zhTermsOfUse from '../zh-termsOfUse.json'

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

export const zh = {
  flag: '🇨🇳',
  ...unflatten<typeof zhBase, typeof base>(zhBase),
  localeName: 'zh',
  termsOfUseMD: zhTermsOfUse.termsOfUseText,
  privacyPolicyMD: zhPrivacyPolicyDev.privacyPolicyText,
  childAbusePrevention: zhChildAbusePrevention.childSafetyAndSexAbusePrevention,
} as const
