import { LevelKind, Appender, LogRecord } from "./types"
import Debug from "debug"
import {
  ConsoleAppenderConfig,
  ConsoleAppender,
  kDefaultConsoleAppenderConfig
} from "./ConsoleAppender"


/**
 * DebugAppender Configuration
 */
export interface DebugAppenderConfig extends ConsoleAppenderConfig {
  levels: LevelKind[]
}

/**
 * Partial of config, used for shortening instead of Partial<...>
 */
export type DebugAppenderOptions = Partial<DebugAppenderConfig>

/**
 * Default console config
 * @type {DebugAppenderConfig}
 */
const defaultConfig: DebugAppenderConfig = {
  levels: ["trace", "debug"],
  ...kDefaultConsoleAppenderConfig
}

const debuggers = new Map<string, Debug.Debugger>()

const debugAppPrefix = "app"

function getDebug(cat: string) {
  let debug = debuggers.get(cat)
  if (!debug) {
    debug = Debug([debugAppPrefix, cat].join(":"))
    debuggers.set(cat, debug)
  }

  return debug
}

/**
 * Debug appender, the simple default appender used
 * everywhere OOB
 */
export class DebugAppender<Record extends LogRecord>
  extends ConsoleAppender<Record>
  implements Appender<Record> {
  readonly config: DebugAppenderConfig

  get levels() {
    return this.config?.levels ?? defaultConfig.levels
  }

  /**
   * Handle log records, transform, push to ES
   *
   * @param record
   */
  append(record: Record): void {
    const { level, message, args, category } = record

    if (!this.levels.includes(level)) {
      super.append(record)
      return 
    }

    const debug = getDebug(category)
    debug(message, ...args)
  }

  /**
   *
   * @param {Partial<DebugAppenderOptions>} options
   */
  constructor(options: Partial<DebugAppenderOptions> = {}) {
    super({
      ...defaultConfig,
      ...options
    })
  }
}
