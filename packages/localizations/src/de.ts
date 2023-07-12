import otherDe from "./chunks/other.de"
import termsOfUse from "./chunks/termsOfUse.de"
import privacyPolicy from "./chunks/privacyPolicy.de"
import {type chunks as enChunks} from "./en"

const chunks: typeof enChunks = {
  "termsOfUseMD": termsOfUse,
  "privacyPolicyMD": privacyPolicy
}

const deLocale = {
  ...otherDe,
  ...chunks
}
export default deLocale
