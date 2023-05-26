import otherEn from "./chunks/other.en"
import termsAndConditionsEn from "./chunks/termsOfUse.en"
import privacyPolicyEn from "./chunks/privacyPolicy.en"

export const chunks = {
  "termsOfUseMD": termsAndConditionsEn,
  "privacyPolicyMD": privacyPolicyEn
}

const enLocale = {
  ...otherEn,
  ...chunks
}
export default enLocale
