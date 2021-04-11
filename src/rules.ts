import {ValueOf, Callback, RequestIdiom, IdiomSet, RulesFunc} from './types'
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


export const delegate = (...gens: RulesFunc[]): RulesFunc => function* () {
  for(const gen of gens){
    yield* gen()
  }
}

export const loop = (gen: RulesFunc, callback = () => true) => function* ()  {
  while (callback()) {
    yield* gen()
  }
}

export const strand = (...idiomSets: IdiomSet[]): RulesFunc =>
  function* ()  {
    for (const set of idiomSets) {
      yield set
    }
  }
