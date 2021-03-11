import {bProgram} from './bProgram'
import {stream as s} from './stream'
import {streamEvents} from './constants'
import {
  RulesFunc,
  ListenerMessage,
  SelectionStrategies,
  CreatedStream,
  IdiomSet,
  TrackReturn,
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

export const track = (
  strands: Record<string, RulesFunc>, strategy?: SelectionStrategies,
): Readonly<TrackReturn> => {
  const stream: CreatedStream = s()
  const {running, trigger} = bProgram(
    strategy,
    stream,
  )
  const feedback = (actions: Record<string, (payload: unknown) => void>) =>
    stream.subscribe(({streamEvent, eventName, payload}: ListenerMessage) => {
      if (streamEvent !== streamEvents.select) return
      actions[eventName as string] && actions[eventName as string](payload)
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
