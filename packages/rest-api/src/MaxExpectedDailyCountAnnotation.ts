import {Context} from 'effect'

export class MaxExpectedDailyCall extends Context.Service<
  MaxExpectedDailyCall,
  number
>()('MaxExpectedDailyCall') {}
