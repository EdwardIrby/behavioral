import {streamEvents, selectionStrategies} from './constants'
export type ValueOf<T> = T[keyof T]

export interface LastEvent {
  strandName: string;
  priority: number;
  eventName?: string
  callback?: (lastEvent: LastEvent) => boolean
  payload?: unknown
}

export type IdiomValue = {
  eventName?: string
  callback?: (lastEvent: LastEvent) => boolean
  payload?: unknown
}


export interface Rule {
  assert?:(lastEvent: LastEvent) => boolean
  request?: IdiomValue[]
  waitFor?: IdiomValue[]
  block?: IdiomValue[]
}
export type RuleGenerator =  Generator<Rule, void, ((assertion: (lastEvent: LastEvent) => boolean) => void)>
export type RulesFunc = () => RuleGenerator
export type ListenerMessage = {
  streamEvent: ValueOf<typeof streamEvents>
  [key: string]: unknown
}
export type Listener = (msg: ListenerMessage) => ListenerMessage | void

interface BidRequired {
  strandName: string
  priority: number
  logicStrand: RuleGenerator
}

export interface Bid extends Rule, BidRequired{}

export interface CandidateBid extends Bid {
  request: IdiomValue[]
}
export interface BlockedBid extends Bid {
  block: IdiomValue[]
}

export interface MappedCandidateBid extends IdiomValue, BidRequired{
  assert?: ((lastEvent: LastEvent) => boolean) | undefined;
  waitFor?: IdiomValue[] | undefined;
  block?: IdiomValue[] | undefined;
}
export type Strategy = ((candidateEvents: MappedCandidateBid[], blockedEvents: IdiomValue[]) => MappedCandidateBid)
export type SelectionStrategies = ValueOf<typeof selectionStrategies> | Strategy
export interface CreatedStream {
  (value: ListenerMessage): void
  subscribe: (listener: Listener) => CreatedStream
}