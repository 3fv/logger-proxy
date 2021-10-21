import { LevelKind, Appender, LogRecord } from "./types"
import { asOption } from "@3fv/prelude-ts"
import Debug from "debug"





/**
 * DebugAppender Configuration
 */
export interface DebugAppenderConfig<Record extends LogRecord = any> {
  levels: string[]
}

/**
 * Partial of config, used for shortening instead of Partial<...>
 */
export type DebugAppenderOptions<Record extends LogRecord> = Partial<
DebugAppenderConfig<Record>
>

/**
 * Default console config
 * @type {DebugAppenderConfig}
 */
const defaultConfig: DebugAppenderConfig = {
  levels: ["debug"]
}


        
const debuggers = new Map<string, Debug.Debugger>()

const debugAppPrefix = "app"

function getDebug(cat: string) {
  let debug = debuggers.get(cat)
  if (!debug) {
    debug = Debug([debugAppPrefix,cat].join(":"))
    debuggers.set(cat,debug)
  }

  return debug
}

/**
 * Debug appender, the simple default appender used
 * everywhere OOB
 */
export class DebugAppender<Record extends LogRecord>
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
    const { level, message, data, args, category, timestamp } = record
    
    if (!this.levels.includes(level)){
      return
    }
    
    const debug = getDebug(category)
    debug(message, ...args)

  }
  
  /**
   *
   * @param {Partial<DebugAppenderOptions<Record>>} options
   */
  constructor(options: Partial<DebugAppenderOptions<Record>> = {}) {
    this.config = {
      ...defaultConfig,
      ...options
    }
  }
}
