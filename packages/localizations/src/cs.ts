import otherCs from "./chunks/other.cs"
import termsOfUse from "./chunks/termsOfUse.cs"
import privacyPolicy from "./chunks/privacyPolicy.cs"
import {type chunks as enChunks} from "./en"

const chunks: typeof enChunks = {
  "termsOfUseMD": termsOfUse,
  "privacyPolicyMD": privacyPolicy
}

const csLocale = {
  ...otherCs,
  ...chunks
}
export default csLocale
