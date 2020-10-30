import {streamEvents, selectionStrategies, baseDynamics} from './constants'
declare module 'behavioral' {
  type ValueOf<T> = T[keyof T]
  interface LastEvent {
    strandName: string;
    priority: number;
    eventName?: string
    callback?: (lastEvent: LastEvent) => boolean
    payload?: unknown
  }
  
  type IdiomValue = {
    eventName?: string
    callback?: (lastEvent: LastEvent) => boolean
    payload?: unknown
  }
  
  
  interface Rule {
    assert?:(lastEvent: LastEvent) => boolean
    request?: IdiomValue[]
    waitFor?: IdiomValue[]
    block?: IdiomValue[]
  }
  type RuleGenerator =  Generator<Rule, void, ((assertion: (lastEvent: LastEvent) => boolean) => void)>
  type RulesFunc = () => RuleGenerator
  type Strategy = ((candidateEvents: MappedCandidateBid[], blockedEvents: IdiomValue[]) => MappedCandidateBid)
  type SelectionStrategies = ValueOf<typeof selectionStrategies> | Strategy
  type ListenerMessage = {
    streamEvent: ValueOf<typeof streamEvents>
    [key: string]: unknown
  }
  type Listener = (msg: ListenerMessage) => ListenerMessage | void
  interface CreatedStream {
    (value: ListenerMessage): void
    subscribe: (listener: Listener) => CreatedStream
  }
  export function loop(gen: RulesFunc, loopCallback?: () => boolean):  RulesFunc
  export function strand (...ruleList: Rule[]): RulesFunc
  export function track (
    strands: Record<string, RulesFunc>,
    { strategy, track }?: {
    strategy?: SelectionStrategies;
    track?: string | undefined;
    }
  ): Readonly<{
    trigger: ({ eventName, payload, baseDynamic, }: {
        eventName: string;
        payload?: unknown;
        baseDynamic: ValueOf<typeof baseDynamics>;
    }) => void;
    feedback: CreatedStream;
    log: CreatedStream;
    add: (logicStands: Record<string, RulesFunc>) => void;
  }>
}
