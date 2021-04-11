import {selectionStrategies, streamEvents, baseDynamics} from './constants'
import {stateChart} from './stateChart'
import {stream} from './stream'
import {
  ValueOf,
  CandidateBid,
  RunningBid,
  PendingBid,
  Strategy,
  SelectionStrategies,
  CreatedStream,
  ListenerMessage,
  FeedbackMessage,
  RulesFunc,
  RuleParameterValue,
} from './types'


export class Track {
  // Candidate and Blocked lists methods 
  static candidatesList(pending: PendingBid[]): CandidateBid[] {
    return pending.reduce<CandidateBid[]>(
      (acc, {request, priority}) => acc.concat(
          // Flatten bids' request arrays
          request ? request.map(
            event => ({priority, ...event}), // create candidates for each request with current bids priority
          ) : [],
      ),
      [],
    )
  }
  static blockedList(pending: PendingBid[]): RuleParameterValue[] {
    return pending.flatMap<RuleParameterValue>(({block}) => block || [])
  }
  // Check if requested event is in the Paramter (waitFor, request, block)
  static requestInParameter({eventName: requestEventName, payload: requestPayload}: CandidateBid) { 
    return({eventName: parameterEventName, callback: parameterCallback}: RuleParameterValue): boolean => (
    parameterCallback
      ? parameterCallback({payload: requestPayload, eventName:requestEventName})
      :requestEventName === parameterEventName
    )
  }
  // Selection Strategies (randomizedPriority: random, chaos priority)
  static shuffle(array: unknown[]): void{
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }
  static randomizedPriority(filteredEvents: CandidateBid[]): CandidateBid{
    Track.shuffle(filteredEvents)
    return filteredEvents.sort(
      ({priority: priorityA}, {priority: priorityB}) => priorityA - priorityB,
    )[0]
  }
  static chaos(filteredEvents: CandidateBid[]): CandidateBid{
    const randomArrayElement = (arr: CandidateBid[]) =>
      arr[Math.floor(Math.random() * Math.floor(arr.length))]
    return randomArrayElement(filteredEvents)
  }
  static priority(filteredEvents: CandidateBid[]): CandidateBid{
    return filteredEvents.sort(
      ({priority: priorityA}, {priority: priorityB}) =>
        priorityA - priorityB,
    )[0]
  }
  eventSelectionStrategy:Strategy  
  pending = new Set<PendingBid>()
  running = new Set<RunningBid>()
  lastEvent:CandidateBid = {} as CandidateBid
  stream: CreatedStream
  debug?: boolean
  constructor(
    strands:  Record<string, RulesFunc>,
    {strategy = selectionStrategies.priority, debug = false}:
    { strategy?: SelectionStrategies; debug?: boolean; } = {},
  ) {
    this.eventSelectionStrategy =
    typeof strategy === 'string'
      ? Track[strategy as ValueOf<typeof selectionStrategies>]
      : strategy as Strategy
    this.stream = stream()
    this.debug = debug
    this.trigger = this.trigger.bind(this)
    this.feedback = this.feedback.bind(this)
    this.add = this.add.bind(this)
    this.add(strands)
  }
  run(): void {
    this.running.size && this.step()
  }
  step(): void {
    for( const bid of this.running){
      const {logicStrand, priority, strandName} = bid
      const {value, done} = logicStrand.next()
      !done &&
        this.pending.add({
          strandName,
          priority,
          logicStrand,
          ...value,
        })
      this.running.delete(bid)
    }
    const pending = [...this.pending]
    const candidates = Track.candidatesList(pending)
    const blocked = Track.blockedList(pending)
    const filteredBids = candidates.filter(
      request => !blocked.some(Track.requestInParameter(request)),
    )
    this.lastEvent = this.eventSelectionStrategy(filteredBids)
    this.debug && this.stream(stateChart({candidates, blocked, pending}))
    this.lastEvent && this.nextStep()
  }
  nextStep(): void {
    for( const bid of this.pending){
      const {request = [], waitFor = [], logicStrand} = bid
      const waitList = [...request, ...waitFor]
      if (waitList.some(Track.requestInParameter(this.lastEvent)) && logicStrand) {
        this.running.add(bid)
        this.pending.delete(bid)
      }
    }
    const {eventName, payload} = this.lastEvent
    this.stream({
      streamEvent: streamEvents.select,
      eventName,
      payload,
    })
    this.run()
  }
  trigger({
    eventName, payload, baseDynamic,
  }: {
    eventName: string;
    payload?: any;
    baseDynamic?: ValueOf<typeof baseDynamics>;
  }): void{
    const logicStrand = function* () {
      yield {
        request: [{eventName, payload}],
        waitFor: [{eventName: '', callback: () => true}],
      }
    }
    this.running.add({
      strandName: `Trigger(${eventName})`,
      priority: 0,
      logicStrand: logicStrand(),
    })
    this.debug && this.stream({
      streamEvent: streamEvents.trigger,
      baseDynamic,
      eventName: `Trigger(${eventName})`,
      payload,
    })
    this.run()
  }
  feedback(actions: Record<string, (payload?: any) => void>): CreatedStream {
    return this.stream.subscribe(({streamEvent, ...rest}: ListenerMessage) => {
      if (streamEvent !== streamEvents.select) return
      const {eventName, payload} = rest as FeedbackMessage
      actions[eventName] && actions[eventName](payload)
    })
  }   
  add(logicStands: Record<string, RulesFunc>):void{
    for (const strandName in logicStands)
      this.running.add({
        strandName,
        priority: this.running.size + 1,
        logicStrand: logicStands[strandName](),
      })
  }
}
