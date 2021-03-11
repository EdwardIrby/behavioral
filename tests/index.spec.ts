import test from 'ava'

import {
  track,
  baseDynamics,
  selectionStrategies,
  loop,
  strand,
} from '../src'
const actual: string[] = []
const expected = [
  'Add hot',
  'Add cold',
  'Add hot',
  'Add cold',
  'Add hot',
  'Add cold',
]

const addHot = () => actual.push('Add hot')
const addCold = () => actual.push('Add cold')

const strands = {
  addHot: strand(
    {
      waitFor: [
        {
          eventName: 'start',
          callback: ({eventName}) => eventName === 'start',
        },
      ],
    },
    {request: [{eventName: 'hot'}]},
    {request: [{eventName: 'hot'}]},
    {request: [{eventName: 'hot'}]},
  ),
  addCold: strand(
    {waitFor: [{eventName: 'start'}]},
    {request: [{eventName: 'cold'}]},
    {request: [{eventName: 'cold'}]},
    {request: [{eventName: 'cold'}]},
  ),
  mixHotCold: loop(
    strand(
      {
        waitFor: [{eventName: 'hot'}],
        block: [{eventName: 'cold'}],
      },
      {
        waitFor: [{eventName: 'cold'}],
        block: [{eventName: 'hot'}],
      },
    ),
  ),
}
const actions = {
  cold(){
    addCold()
  },
  hot(){
    addHot()
  },
}

test('plait(): priority queue', t => {
  const streamLog: unknown[] = []
  const {trigger, feedback, stream} = track(strands)
  feedback(actions)
  stream.subscribe(msg => {
    streamLog.push(msg)
  })
  trigger({
    eventName: 'start',
    payload: ['start'],
    baseDynamic: baseDynamics.objectObject,
  })
  t.deepEqual(actual, expected)
  t.snapshot(streamLog, 'priority log snapshot')
})
test('plait(): randomized priority queue', t => {
  const streamLog: unknown[] = []
  actual.length = 0
  const {trigger, feedback, stream} = track(strands, {
    strategy: selectionStrategies.random,
  })
  feedback(actions)
  stream.subscribe(msg => {
    streamLog.push(msg)
  })
  trigger({
    eventName: 'start',
    payload: ['start'],
    baseDynamic: baseDynamics.objectObject,
  })
  t.deepEqual(actual, expected)
  t.snapshot(streamLog, 'randomized priority log snapshot')
})
test('plait(): chaos selection', t => {
  const streamLog: unknown[]  = []
  actual.length = 0
  const {trigger, feedback, stream} = track(strands, {
    strategy: selectionStrategies.chaos,
  })
  feedback(actions)
  stream.subscribe(msg => {
    streamLog.push(msg)
  })
  trigger({
    eventName: 'start',
    payload: ['start'],
    baseDynamic: baseDynamics.objectObject,
  })
  t.deepEqual(actual, expected)
  t.snapshot(streamLog, 'chaos log snapshot')
})
