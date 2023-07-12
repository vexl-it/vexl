import otherIt from "./chunks/other.it"
import termsOfUse from "./chunks/termsOfUse.it"
import privacyPolicy from "./chunks/privacyPolicy.it"
import {type chunks as enChunks} from "./en"

const chunks: typeof enChunks = {
  "termsOfUseMD": termsOfUse,
  "privacyPolicyMD": privacyPolicy
}

const itLocale = {
  ...otherIt,
  ...chunks
}
export default itLocale
