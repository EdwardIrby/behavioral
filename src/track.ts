import {bProgram} from './bProgram'
import {stream as s} from './stream'
import {streamEvents} from './constants'
import {Rule, RulesFunc, ListenerMessage, SelectionStrategies, CreatedStream} from './types'


export const loop = (gen: RulesFunc, loopCallback = () => true): RulesFunc =>
  function* ()  {
    while (loopCallback()) {
      yield* gen()
    }
  }

export const strand = (...ruleList: Rule[]): RulesFunc =>
  function* ()  {
    for (const {assert, ...rule} of ruleList) {
      const callback = yield rule
      assert && callback(assert)
    }
  }

export const track = (
  strands: Record<string, RulesFunc>,
  {strategy, track}: { strategy?: SelectionStrategies, track?: string} = {},
) => {
  const stream: CreatedStream = s()
  const {running, trigger} = bProgram(
    strategy,
    stream,
  )
  const feedback = (actions: Record<string, (msg: {payload: unknown, eventName: string}) => void>) =>
    stream.subscribe(({streamEvent, eventName, payload}: ListenerMessage) => {
      if (streamEvent !== streamEvents.select) return
      actions[eventName as string] && actions[eventName as string]({payload, eventName: eventName as string})
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
