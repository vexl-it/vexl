import {clubsErrorMessage} from '../services/clubs'
import {makeClubsAdminClient} from '../services/contactInternalApi'
import {useAdminApi} from './useAdminApi'

export const useClubsApi = () =>
  useAdminApi(makeClubsAdminClient, clubsErrorMessage)
