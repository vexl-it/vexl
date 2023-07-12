import otherPt from "./chunks/other.pt"
import termsOfUse from "./chunks/termsOfUse.pt"
import privacyPolicy from "./chunks/privacyPolicy.pt"
import {type chunks as enChunks} from "./en"

const chunks: typeof enChunks = {
  "termsOfUseMD": termsOfUse,
  "privacyPolicyMD": privacyPolicy
}

const ptLocale = {
  ...otherPt,
  ...chunks
}
export default ptLocale
