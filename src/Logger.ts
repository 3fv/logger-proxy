import { LevelKind, LevelNames, LevelThresholds, LogRecord } from "./types"
import { Level } from "./types"
import type { LoggingManager } from "./LoggingManager"
import { isString } from "./util"
import { pick } from "lodash"

// const baseConsoleLogger = LevelNames.reduce(
//   (logger: any, level: string) => ({
//     ...logger,
//     [level]: consoleLevelToFn(level),
//     ["is" + level[0].toUpperCase() + level.substr(1) + "Enabled"]: () => true
//   }),
//   { name: undefined } as any
// ) as ILogger
//
export interface LoggerState {
  overrideLevel?: LevelKind
}

export class Logger {
  readonly state: LoggerState = {}

  get infoEnabled() {
    return LevelThresholds["info"]
  }

  

  log(record: LogRecord)
  log(level: LevelKind, message: string, ...args: any[])
  log(levelOrRecord: LevelKind | LogRecord, ...args: any[]) {
    const record = isString(levelOrRecord)
      ? ({
          ...pick(this, ["category"]),
          message: args[0],
          level: levelOrRecord,
          data: args.slice(1)
        } as LogRecord)
      : levelOrRecord

    this.manager.fire(record)
  }

  private createLevelLogger(level: LevelKind) {
    return (message: string, ...args: any[]) => {
      this.log(level, message, ...args)
    }
  }

  readonly trace = this.createLevelLogger("trace")
  readonly debug = this.createLevelLogger("debug")
  readonly info = this.createLevelLogger("info")
  readonly warn = this.createLevelLogger("warn")
  readonly error = this.createLevelLogger("error")
  readonly fatal = this.createLevelLogger("fatal")
  
  constructor(
    public readonly manager: LoggingManager,
    public readonly category: string
  ) {}
}

//
//
// /**
//  * Create the base line logger for
//  * a category
//  *
//  * @returns {any}
//  * @param fullName
//  */
// const createWrappedLogger = (fullName: string) => {
//
//
//   const cache = new Map<Level, Function>()
//   const getFn = (level: Level) => {
//     if (!cache.has(level)) {
//       cache.set(level, (...args) => {
//         const manager = getLoggingManager()
//         if (!!manager && manager.onMessage({
//           name,
//           level,
//           timestamp: Date.now(),
//           args,
//         }) === false) {
//
//         }
//
//
//         const logFn = baseConsoleLogger[level]
//         logFn(`[${name}] (${level})`, ...args)
//       })
//     }
//     return cache.get(level)
//   }
//   return new Proxy(baseConsoleLogger, {
//     get(target: ILogger, p: PropertyKey, receiver: any): any {
//       const value = target[p]
//       if (!isString(p) || !value || typeof value !== "function") {
//         return value
//       }
//       const fn = value as (...args: any[]) => void
//
//
//       if (LevelNames.includes(p as any)) {
//         return getFn(p as Level)
//       } else {
//         return value
//       }
//     }
//   })
// }

// export function getLogger(
//   name: string
// ) {
//   return createWrappedLogger(name)
// }
