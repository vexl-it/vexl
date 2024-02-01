import {type TFunction} from '../../utils/localization/I18nProvider'

export interface MigrationProgress {
  percent: number
  text?: Parameters<TFunction>[0]
}
