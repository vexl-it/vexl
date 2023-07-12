import otherFr from "./chunks/other.fr"
import termsOfUse from "./chunks/termsOfUse.fr"
import privacyPolicy from "./chunks/privacyPolicy.fr"
import {type chunks as enChunks} from "./en"

const chunks: typeof enChunks = {
  "termsOfUseMD": termsOfUse,
  "privacyPolicyMD": privacyPolicy
}

const frLocale = {
  ...otherFr,
  ...chunks
}
export default frLocale
