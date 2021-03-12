import {CandidateBid, RuleParameterValue} from './types'
export const requestInParameter = (
  {eventName: requestEventName, payload: requestPayload}: CandidateBid,
) => ({eventName: parameterEventName, callback: payloadCallback}: RuleParameterValue): boolean => (
  payloadCallback
    ? payloadCallback({payload: requestPayload, eventName:requestEventName})
    :requestEventName === parameterEventName
)
