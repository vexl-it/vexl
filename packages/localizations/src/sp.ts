import otherSp from "./chunks/other.sp"
import termsOfUse from "./chunks/termsOfUse.sp"
import privacyPolicy from "./chunks/privacyPolicy.sp"
import {type chunks as enChunks} from "./en"

const chunks: typeof enChunks = {
  "termsOfUseMD": termsOfUse,
  "privacyPolicyMD": privacyPolicy
}

const spLocale = {
  ...otherSp,
  ...chunks
}
export default spLocale
