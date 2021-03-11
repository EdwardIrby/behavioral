import {ValueOf} from './types'
import {idioms} from './constants'


const idiom = (key: ValueOf<typeof idioms>)  => <T>(...idioms: {
  eventName: string
  payload?: T
  callback?: <P>(props: {eventName: string; payload?:P}) => boolean;
}[]) => {
  return {
    [key]: [...idioms],
  }
}

export const waitFor = idiom('waitFor')
export const request = idiom('request')
export const block = idiom('block')
