import {bProgram} from './bProgram'
import {stream} from './stream.js'
import {streamEvents} from './constants.js'

/** @type {import('./typings/index').loop} */
export const loop = (gen, loopCallback = () => true) =>
  function* ()  {
    while (loopCallback()) {
      yield* gen()
    }
  }

/** @type {import('./typings/index').strand} */
export const strand = (...ruleList) =>
  function* ()  {
    for (const {assert, ...rule} of ruleList) {
      const callback = yield rule
      assert && callback(assert)
    }
  }

/** @type {import('./typings/index').track} */
export const track = (
  strands,
  {strategy, track} = {},
) => {
  const send = stream()
  const {running, trigger} = bProgram(
    strategy,
    send,
  )
  const log = send.subscribe(details => ({
    ...(track && {track}),
    ...details,
  }))
  const feedback = send.subscribe(({streamEvent, ...details}) => {
    if (streamEvent !== streamEvents.select) return
    return {...(track && {track}), streamEvent, ...details}
  })
  const add = logicStands => {
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
