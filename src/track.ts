import {bProgram} from './bProgram'
import {stream as s} from './stream'
import {streamEvents, selectionStrategies} from './constants'
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

export const track: Track = (strands, {strategy = selectionStrategies.priority, debug = false}= {})=> {
  const stream: CreatedStream = s()
  const {running, trigger} = bProgram({stream, strategy, debug})
  const feedback = (actions: Record<string, ({eventName, payload}: FeedbackMessage) => void>) =>
    stream.subscribe(({streamEvent, ...rest}: ListenerMessage) => {
      if (streamEvent !== streamEvents.select) return
      const {eventName, payload} = rest as FeedbackMessage
      actions[eventName] && actions[eventName]({eventName, payload})
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
