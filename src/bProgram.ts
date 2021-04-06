import {selectionStrategies, streamEvents} from './constants'
import {stateChart} from './stateChart'
import {requestInParameter} from './requestInParameter'
import {
  ValueOf,
  CandidateBid,
  RunningBid,
  PendingBid,
  Strategy,
  BProgram,
  Trigger,
} from './types'
/** @description a function that checks whether a parameter callback function returns true or that the parameter evenName equals the request event name */

import {strategies} from './strategies'
import {blockedList, candidatesList} from './lists'



export const bProgram: BProgram = ({
  strategy,
  stream,
  debug,
}) => {
  const eventSelectionStrategy  =
    typeof strategy === 'string'
      ? strategies[strategy as ValueOf<typeof selectionStrategies>]
      : strategy as Strategy
  const pending = new Set<PendingBid>()
  const running = new Set<RunningBid>()
  let lastEvent = {} as CandidateBid
  function run() {
    running.size && step()
  }
  function step() {
    running.forEach(bid => {
      const {logicStrand, priority, strandName} = bid
      const {value, done} = logicStrand.next()
      !done &&
        pending.add({
          strandName,
          priority,
          logicStrand,
          ...value,
        })
      running.delete(bid)
    })
    const candidates = candidatesList([...pending])
    const blocked = blockedList([...pending])
    const filteredBids = candidates.filter(
      request => !blocked.some(requestInParameter(request)),
    )
    lastEvent = eventSelectionStrategy(filteredBids)
    debug && stream(stateChart({candidates, blocked, pending}))
    lastEvent && nextStep()
  }
  function nextStep() {
    pending.forEach(bid => {
      const {request = [], waitFor = [], logicStrand} = bid
      const waitList = [...request, ...waitFor]
      if (waitList.some(requestInParameter(lastEvent)) && logicStrand) {
        running.add(bid)
        pending.delete(bid)
      }
    })
    const {eventName, payload} = lastEvent
    stream({
      streamEvent: streamEvents.select,
      eventName,
      payload,
    })
    run()
  }
  const trigger: Trigger = ({
    eventName, payload, baseDynamic,
  }) => {
    const logicStrand = function* () {
      yield {
        request: [{eventName, payload}],
        waitFor: [{eventName: '', callback: () => true}],
      }
    }
    running.add({
      strandName: `Trigger(${eventName})`,
      priority: 0,
      logicStrand: logicStrand(),
    })
    debug && stream({
      streamEvent: streamEvents.trigger,
      baseDynamic,
      eventName: `Trigger(${eventName})`,
      payload,
    })
    run()
  }
  return {running, trigger}
}
