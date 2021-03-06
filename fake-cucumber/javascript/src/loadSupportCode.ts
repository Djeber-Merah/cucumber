import SupportCode from './SupportCode'
import { IdGenerator } from '@cucumber/messages'
import PerfHooksClock from './PerfHooksClock'
import {
  MakeErrorMessage,
  withFullStackTrace,
  withSourceFramesOnlyStackTrace,
} from './ErrorMessageGenerator'
import IncrementClock from './IncrementClock'
import * as dsl from './dsl'
import findSupportCodePaths from './findSupportCodePaths'
import { NewId } from '@cucumber/messages/dist/src/IdGenerator'
import IClock from './IClock'

export default async function loadSupportCode(
  predictableIds: boolean,
  requirePaths: ReadonlyArray<string>,
  globals: boolean
): Promise<SupportCode> {
  const supportCode = makeSupportCode(predictableIds)
  if (globals) {
    for (const key of Object.keys(dsl)) {
      // @ts-ignore
      global[key] = supportCode[key]
    }
  }

  dsl.setSupportCode(supportCode)
  const supportCodePaths = await findSupportCodePaths(requirePaths)
  let tsNodeRegistered = false
  for (const supportCodePath of supportCodePaths) {
    if (supportCodePath.endsWith('.ts') && !tsNodeRegistered) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tsnode = require('ts-node')
      tsnode.register({
        transpileOnly: true,
      })
      tsNodeRegistered = true
    }
    require(supportCodePath)
  }
  return supportCode
}

function makeSupportCode(predictableIds: boolean) {
  let newId: NewId
  let clock: IClock
  let makeErrorMessage: MakeErrorMessage
  if (predictableIds) {
    newId = IdGenerator.incrementing()
    clock = new IncrementClock()
    makeErrorMessage = withSourceFramesOnlyStackTrace()
  } else {
    newId = IdGenerator.uuid()
    clock = new PerfHooksClock()
    makeErrorMessage = withFullStackTrace()
  }
  return new SupportCode(newId, clock, makeErrorMessage)
}
