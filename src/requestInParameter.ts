import {CandidateBid, RuleParameterValue} from './types'
export const requestInParameter = (
  {eventName: requestEventName, payload: requestPayload}: CandidateBid,
) => ({eventName: parameterEventName, callback: parameterCallback}: RuleParameterValue): boolean => (
  parameterCallback
    ? parameterCallback({payload: requestPayload, eventName:requestEventName})
    :requestEventName === parameterEventName
)
