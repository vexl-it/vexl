import {Context} from 'effect/index'

export class MaxExpectedDailyCall extends Context.Tag('MaxExpectedDailyCall')<
  MaxExpectedDailyCall,
  number
>() {}
