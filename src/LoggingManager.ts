import { isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import { isEmpty, negate } from "lodash"
import type { Appender } from "./Appender"
import { ConsoleAppender } from "./appenders/ConsoleAppender"
import { Level, LevelKind, LevelThresholds } from "./Level"
import { Logger, LoggerOptions } from "./Logger"
import type { LogRecord } from "./LogRecord"

export type CategoryMatch = RegExp | string

export type ThresholdOverride = [match: CategoryMatch, level: LevelKind]

export interface LoggingManagerState<Record extends LogRecord> {
  rootLevel: LevelKind
  appenders: Array<Appender<Record>>
  thresholdOverrides: Array<ThresholdOverride>
}

function parseThresholdOverridePatterns(value: string, level: LevelKind = "debug"):ThresholdOverride[] {
  return value.split(",").map(s => [new RegExp(s), level] as ThresholdOverride)
}

export const kEnvThresholdOverrides = asOption(process.env.DEBUG_PATTERNS)
  .filter(negate(isEmpty))
  .map(parseThresholdOverridePatterns)
  .getOrElse([])

/**
 * Logging manager
 */
export class LoggingManager<Record extends LogRecord = any> {
  
  readonly loggers = new Map<string, Logger>()

  readonly state: LoggingManagerState<Record> = {
    appenders: [],
    rootLevel: Level.info,
    thresholdOverrides: kEnvThresholdOverrides
  }

  

  get rootLevel() {
    return this.state.rootLevel
  }

  set rootLevel(newRootLevel: LevelKind) {
    this.state.rootLevel = newRootLevel
  }

  get rootThreshold() {
    return LevelThresholds[this.rootLevel]
  }

  /**
   * Get the current handler
   *
   * @returns {Appender<Record>}
   */
  get appenders(): Array<Appender<Record>> {
    return asOption(this.state.appenders)
      .filter((appenders) => appenders.length > 0)
      .getOrCall(() => {
        this.state.appenders.push(new ConsoleAppender())
        return this.state.appenders
      })
  }

  get thresholdOverrides() {
    return this.state.thresholdOverrides
  }

  /**
   * Set the handler explicitly
   *
   * @param newAppenders
   */
  set appenders(newAppenders: Array<Appender<Record>>) {
    // WE MUTATE DO TO THE LIKELIHOOD OF SOMEONE HOLDING A REF TO THE ARRAY,
    // CONVERT TO OBSERVABLE AT SOMEPOINT
    const persistentAppenders = this.state.appenders
    persistentAppenders.length = 0
    persistentAppenders.push(...asOption(newAppenders).getOrElse([]))
  }

  clearThresholdOverrides() {
    this.state.thresholdOverrides.length = 0
    return this
  }

  addThresholdOverrides(...overrides: Array<ThresholdOverride>) {
    this.state.thresholdOverrides.push(...overrides)
    return this
  }

  /**
   * Check for any matching threshold overrides
   * 
   * @param category 
   */
  determineThresholdOverride(category: string) {
    const override = this.thresholdOverrides.find(([match]) => isString(match) ? match === category : match.test(category))
    if (!override) {
      return null
    } else {
      const [,level] = override
      return LevelThresholds[level]
    }
    
  }
  
  setRootLevel(newLevel: LevelKind) {
    this.state.rootLevel = newLevel
  }

  
  

  fire(record: LogRecord<Record>) {
    this.appenders.forEach((appender) => appender.append(record as Record))
  }

  getLogger(
    categoryOrFilename: string,
    inOptions: Partial<LoggerOptions> = {}
  ): Logger {
    const options = Logger.hydrateOptions(inOptions)
    const category = Logger.interoplateCategory(categoryOrFilename, options)

    return asOption(category)
      .map((category) => this.loggers.get(category))
      .getOrCall(() => {
        const logger = new Logger(this, category, options)
        this.loggers.set(category, logger)
        return logger
      })
  }

  private constructor() {

  }

  private static manager: LoggingManager

  static get<Record extends LogRecord = any>(): LoggingManager<Record> {
    if (!this.manager) {
      this.manager = new LoggingManager<Record>()
    }
    return this.manager
  }
}

export function getLoggingManager(): LoggingManager {
  return LoggingManager.get()
}
