import {ValueOf, Callback, RequestIdiom} from './types'
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
export const block = idiom('block')
export const request = idiom('request') as  RequestIdiom
