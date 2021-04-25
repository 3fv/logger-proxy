import { LevelKind, Appender, LogRecord } from "./types"
import { asOption } from "@3fv/prelude-ts"


const consoleLogBindings = new Map<LevelKind, (...args: any[]) => any>()

function getBoundConsoleFn(level: LevelKind) {
  return (console[level] ?? console.log).bind(console)
}

/**
 * Get a cached console bound log function
 *
 * @param {LevelKind} level
 * @returns {(...args: any[]) => any}
 */
export function getConsoleLogBinding(level: LevelKind) {
  if (!consoleLogBindings.has(level)) {
    consoleLogBindings.set(level, getBoundConsoleFn(level))
  }

  return consoleLogBindings.get(level)
}

/**
 * ConsoleAppender Configuration
 */
export interface ConsoleAppenderConfig<Record extends LogRecord = any> {
  cacheEnabled: boolean
  prettyPrint: boolean
}

/**
 * Partial of config, used for shortening instead of Partial<...>
 */
export type ConsoleAppenderOptions<Record extends LogRecord> = Partial<
  ConsoleAppenderConfig<Record>
>

/**
 * Default console config
 * @type {ConsoleAppenderConfig}
 */
const defaultConfig: ConsoleAppenderConfig = {
  cacheEnabled: true,
  prettyPrint: true
}

/**
 * Console appender, the simple default appender used
 * everywhere OOB
 */
export class ConsoleAppender<Record extends LogRecord>
  implements Appender<Record> {
 
  readonly config: ConsoleAppenderConfig

  //private readonly formatArg = (arg: any) => (!arg) ? arg : isObject(arg) ? arg :   this.config.prettyPrint ?  JSON.stringify(arg,null,2) : JSON.stringify(arg)
  
  /**
   * Handle log records, transform, push to ES
   *
   * @param record
   */
  append(record: Record): void {
    const { level, message, data, args, category, timestamp } = record

    // let logFn: Function
    // if (this.config.cacheEnabled) {
    //   logFn = getConsoleLogBinding(record.level)
    // } else {
    //   logFn = getBoundConsoleFn(record.level)
    // }

    asOption([`[${category}]  (${level})  ${message}`,
      ...(Array.isArray(args) ? args : [args])])
      .map(args => {
        asOption(console[record.level])
          .orElse(() => asOption(console.log))
          .map(fn => fn.apply(
          console,
          args
        ))
        
      })
  }
  
  /**
   *
   * @param {Partial<ConsoleAppenderOptions<Record>>} options
   */
  constructor(options: Partial<ConsoleAppenderOptions<Record>> = {}) {
    this.config = {
      ...defaultConfig,
      ...options
    }
  }
}
