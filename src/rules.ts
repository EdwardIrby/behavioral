import {ValueOf, Callback} from './types'
import {idioms} from './constants'


const idiom = (key: ValueOf<typeof idioms>)  => (...idioms: {
  eventName?: string
  payload?: unknown
  callback?: Callback
}[]) => {
  return {
    [key]: [...idioms],
  }
}

export const waitFor = idiom('waitFor')
export const request = idiom('request')
export const block = idiom('block')
