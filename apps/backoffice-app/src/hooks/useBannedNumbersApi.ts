import {bannedNumbersErrorMessage} from '../services/bannedNumbers'
import {makeBannedNumbersAdminClient} from '../services/contactInternalApi'
import {useAdminApi} from './useAdminApi'

export const useBannedNumbersApi = () =>
  useAdminApi(makeBannedNumbersAdminClient, bannedNumbersErrorMessage)
