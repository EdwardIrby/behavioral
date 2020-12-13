import {bProgram} from './bProgram'
import {stream} from './stream'
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
  const send: CreatedStream = stream()
  const {running, trigger} = bProgram(
    strategy,
    send,
  )
  const log = send.subscribe((details: ListenerMessage) => ({
    ...(track && {track}),
    ...details,
  }))
  const selectedStream = send.subscribe(({streamEvent, ...details}: ListenerMessage) => {
    if (streamEvent !== streamEvents.select) return
    return details
  })
  const feedback = (actions: Record<string, (msg: {payload: unknown, eventName: string}) => void>) => 
    selectedStream.subscribe(({eventName, payload}) => {
      actions[eventName as string] && actions[eventName as string]({payload, eventName: eventName as string})
    },
    )
  const add = (logicStands: Record<string, RulesFunc>) => {
    for (const strandName in logicStands)
      running.add({
        strandName,
        priority: running.size + 1,
        logicStrand: logicStands[strandName](),
      })
  }
  add(strands)
  return Object.freeze({trigger, feedback, log, add})
}
