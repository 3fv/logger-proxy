import { fromPairs } from "lodash"

export enum Level {
  trace = "trace",
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
  fatal = "fatal"
}

export type LevelName = `${Level}`
export type LevelKind = LevelName | Level
export const LevelNames:Array<LevelName> = Object.values(Level)
export const LevelThresholds = fromPairs(LevelNames.map((level, i) => [level, i])) as Record<LevelKind, number>
export type LevelEnableFnName = `is${Capitalize<LevelName>}Enabled`

export interface LogHandler<Record extends LogRecord = any> {
  handle:(record:Record) => void
}

// export type ILogger = {
//   name:string
// } & {
//   [Level in LevelName]:(message:string, ...args:any[]) => void
//
// } & {
//   [Fn in LevelEnableFnName]:() => boolean
// }
// & {
//   isTraceEnabled: () => boolean
//   isDebugEnabled: () => boolean
//   isInfoEnabled: () => boolean
//   isWarnEnabled: () => boolean
// }

export interface LogRecord<Data = any> {
  category:string
  timestamp:number
  level:LevelKind
  data?:Data
  message:string
}
