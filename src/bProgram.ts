/* eslint-disable @typescript-eslint/ban-ts-comment */
import {selectionStrategies, streamEvents, baseDynamics} from './constants'
import {
  ValueOf,
  CandidateBid,
  RunningBid,
  PendingBid,
  Strategy,
  SelectionStrategies,
  RuleParameterValue,
  CreatedStream,
} from './types'
/** @description a function that checks whether a parameter callback function returns true or that the parameter evenName equals the request event name */
export const requestInParameter = (
  {eventName: requestEventName, payload: requestPayload}: CandidateBid,
) => ({eventName: payloadEventName, callback: payloadCallback}: RuleParameterValue): boolean =>{
  const isMatchingEventName = requestEventName === payloadEventName
  if(!isMatchingEventName) return false
  return payloadCallback ? payloadCallback(requestPayload) : true
}
  

const candidatesList = (pending: PendingBid[]) => pending.reduce<CandidateBid[]>(
  (acc, {request, ...rest}) => acc.concat(
      // Flatten bids' request arrays
      request ? request.map(
        event => ({...rest, ...event}), // create candidates for each request with current bids priority
      ) : [],
  ),
  [],
)
const blockedList = (pending: PendingBid[]) => pending.reduce<RuleParameterValue[]>(
  (acc, {block}) => acc.concat(
      // Flatten bids' block arrays
      block ? block.map(
        event => event, // create candidates for each block with current bids priority
      ) : [],
  ),
  [],
)
const shuffle = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
const randomizedPriority = (candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => {
  const filteredEvents = candidateEvents.filter(
    request => !blockedEvents.some(requestInParameter(request)),
  )
  shuffle(filteredEvents)
  return filteredEvents.sort(
    ({priority: priorityA}, {priority: priorityB}) => priorityA - priorityB,
  )[0]
}
const chaosStrategy = (candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => {
  const randomArrayElement = (arr: CandidateBid[]) =>
    arr[Math.floor(Math.random() * Math.floor(arr.length))]
  return randomArrayElement(
    candidateEvents.filter(
      request => !blockedEvents.some(requestInParameter(request)),
    ),
  )
}
const priorityStrategy = (candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => {
  return candidateEvents
    .filter(request => !blockedEvents.some(requestInParameter(request)))
    .sort(
      ({priority: priorityA}, {priority: priorityB}) =>
        priorityA - priorityB,
    )[0]
}
const strategies: Record<ValueOf<typeof selectionStrategies>, Strategy> = {
  [selectionStrategies.random]: randomizedPriority,
  [selectionStrategies.priority]: priorityStrategy,
  [selectionStrategies.chaos]: chaosStrategy,
}

export const bProgram = (
  strategy: SelectionStrategies = selectionStrategies.priority,
  stream: CreatedStream,
):{
  running: Set<RunningBid>;
  trigger: <T>({eventName, payload, baseDynamic}: {
      eventName: string;
      payload?: T | undefined;
      baseDynamic: ValueOf<typeof baseDynamics>;
  }) => void;
} => {
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
    lastEvent = eventSelectionStrategy(candidates, blocked)
    stream(stateChart(candidates, blocked))
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
  function stateChart(candidates: CandidateBid[], blocked: RuleParameterValue[]) {
    const strands = [...pending]
      .filter(({strandName}) => strandName)
      .map(({strandName}) => strandName)
    const Blocked = [
      ...new Set(blocked.map(({eventName}) => eventName).filter(Boolean)),
    ]
    const Requests = [
      ...new Set(
        candidates
          .map(request => ({
            eventName: request.eventName,
            payload: request.payload,
          }))
          .filter(Boolean),
      ),
    ]
    return {
      streamEvent: streamEvents.state,
      logicStrands: [...new Set(strands)],
      requestedEvents: Requests,
      blockedEvents: Blocked,
    }
  }
  const trigger = ({
    eventName, payload, baseDynamic,
  }: {
    eventName: string, payload?: unknown, baseDynamic: ValueOf<typeof baseDynamics>
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
    stream({
      streamEvent: streamEvents.trigger,
      baseDynamic,
      eventName: `Trigger(${eventName})`,
      payload,
    })
    run()
  }
  return {running, trigger}
}
