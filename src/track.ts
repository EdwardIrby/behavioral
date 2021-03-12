import {bProgram} from './bProgram'
import {stream as s} from './stream'
import {streamEvents} from './constants'
import {strategies} from './strategies'
import {
  RulesFunc,
  ListenerMessage,
  CreatedStream,
  IdiomSet,
  Track,
  FeedbackMessage,
} from './types'

export const loop = (gen: RulesFunc, loopCallback = () => true): RulesFunc =>
  function* ()  {
    while (loopCallback()) {
      yield* gen()
    }
  }

export const strand = (...idiomSets: IdiomSet[]): RulesFunc =>
  function* ()  {
    for (const set of idiomSets) {
      yield set
    }
  }

export const track: Track = (strands, options = {strategy: strategies.priority, debug: false})=> {
  const stream: CreatedStream = s()
  const {running, trigger} = bProgram({stream, ...options})
  const feedback = (actions: Record<string, ({eventName, payload}: FeedbackMessage) => void>) =>
    stream.subscribe(({streamEvent, eventName, payload}: ListenerMessage) => {
      if (streamEvent !== streamEvents.select) return
      actions[eventName as string] && actions[eventName as string]({eventName, payload})
    })
  const add = (logicStands: Record<string, RulesFunc>) => {
    for (const strandName in logicStands)
      running.add({
        strandName,
        priority: running.size + 1,
        logicStrand: logicStands[strandName](),
      })
  }
  add(strands)
  return Object.freeze({trigger, feedback, stream, add})
}
