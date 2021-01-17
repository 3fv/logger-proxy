

export enum Level {
  trace = "trace",
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
  fatal = "fatal"
}

export type LevelName = keyof typeof Level
export type LevelKind = LevelName | Level
export const LevelNames: Array<LevelName> = Object.values(Level)

export type LevelEnableFnName = `is${Capitalize<LevelName>}Enabled`

export type ILogger = {
  name: string
}&{
  [Level in LevelName]: (message: string, ...args: any[]) => void
  
} & {
  [Fn in LevelEnableFnName]: () => boolean
}
// & {
//   isTraceEnabled: () => boolean
//   isDebugEnabled: () => boolean
//   isInfoEnabled: () => boolean
//   isWarnEnabled: () => boolean
// }


export interface ILoggerEvent<Data extends {} = any> {
  name: string
  timestamp: number
  level: LevelKind
  data?: Data
  args?: any[]
}
