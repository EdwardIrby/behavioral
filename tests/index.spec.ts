import test from 'ava'

import {
  track,
  baseDynamics,
  selectionStrategies,
  loop,
  strand,
} from '..'
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
        assert: ({eventName}) => eventName === 'hot',
      },
      {
        waitFor: [{eventName: 'cold'}],
        block: [{eventName: 'hot'}],
        assert: ({eventName}) => eventName === 'cold',
      },
    ),
  ),
}

test('plait(): priority queue', t => {
  const streamLog: unknown[] = []
  const {trigger, feedback, log} = track(strands)
  feedback.subscribe(msg => {
    msg.eventName === 'hot' && addHot()
  })
  feedback.subscribe(msg => {
    msg.eventName === 'cold' && addCold()
  })
  log.subscribe(msg => {
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
  const {trigger, feedback, log} = track(strands, {
    strategy: selectionStrategies.random,
  })
  feedback.subscribe(msg => {
    msg.eventName === 'hot' && addHot()
  })
  feedback.subscribe(msg => {
    msg.eventName === 'cold' && addCold()
  })
  log.subscribe(msg => {
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
  const {trigger, feedback, log} = track(strands, {
    strategy: selectionStrategies.chaos,
  })
  feedback.subscribe(msg => {
    msg.eventName === 'hot' && addHot()
  })
  feedback.subscribe(msg => {
    msg.eventName === 'cold' && addCold()
  })
  log.subscribe(msg => {
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
