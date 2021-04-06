import { LevelKind, LogHandler, LogRecord } from "./types"
import { asOption } from "@3fv/prelude-ts"
import { isString } from "@3fv/guard"

const consoleLogBindings = new Map<LevelKind, (...args: any[]) => any>()

function getBoundConsoleFn(level: LevelKind) {
  return (console[level] ?? console.log).bind(console)
}

export function getConsoleLogBinding(level: LevelKind) {
  if (!consoleLogBindings.has(level)) {
    consoleLogBindings.set(level, getBoundConsoleFn(level))
  }

  return consoleLogBindings.get(level)
}

export interface ConsoleLogHandlerConfig<Record extends LogRecord = any> {
  cacheEnabled: boolean
  prettyPrint: boolean
}

export type ConsoleLogHandlerOptions<Record extends LogRecord> = Partial<
  ConsoleLogHandlerConfig<Record>
>

const defaultConfig: ConsoleLogHandlerConfig = {
  cacheEnabled: true,
  prettyPrint: true
}

export class ConsoleLogHandler<Record extends LogRecord>
  implements LogHandler<Record> {
 
  readonly config: ConsoleLogHandlerConfig

  private readonly formatArg = (arg: any) => (!arg) ? arg :  this.config.prettyPrint ?  JSON.stringify(arg,null,2) : JSON.stringify(arg)
  
  /**
   * Handle log records, transform, push to ES
   *
   * @param record
   */
  handle(record: Record): void {
    const { level, message, data, args, category, timestamp } = record

    // let logFn: Function
    // if (this.config.cacheEnabled) {
    //   logFn = getConsoleLogBinding(record.level)
    // } else {
    //   logFn = getBoundConsoleFn(record.level)
    // }

    asOption([`[${category}]  (${level})  ${message}`,
      ...(Array.isArray(args) ? args : [args])])
      .map(args => args.map(this.formatArg))
      .map(args => {
        if (typeof process?.stdout !== "undefined") {
          process.stdout.write(args.join('\t') + '\n')
        } else {
          console[record.level].apply(
            console,
            args
          )
        }
      })
  }
  
  /**
   *
   * @param {Partial<ConsoleLogHandlerOptions<Record>>} options
   */
  constructor(options: Partial<ConsoleLogHandlerOptions<Record>> = {}) {
    this.config = {
      ...defaultConfig,
      ...options
    }
  }
}
