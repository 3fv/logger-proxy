import {
  LogRecord
} from "./LogRecord"
import { Appender } from "./Appender"
import { Level, LevelKind, LevelThresholds } from "./Level"
import { asOption, Vector } from "@3fv/prelude-ts"
import { ConsoleAppender } from "./appenders/ConsoleAppender"
import { Logger } from "./Logger"


function interpretFilename(filename: string) {
  return asOption(filename.split("/").pop().split("."))
    .map((parts) =>
      (parts.length > 1 ? parts.slice(0, parts.length - 1) : parts).join(".")
    )
    .get()
}

interface LoggingManagerState<Record extends LogRecord> {
  rootLevel: LevelKind
  appenders: Array<Appender<Record>>
}

/**
 * Logging manager
 */
export class LoggingManager<Record extends LogRecord = any> {
  readonly loggers = new Map<string, Logger>()

  readonly state: LoggingManagerState<Record> = {
    appenders: [],
    rootLevel: Level.info
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
      .filter(appenders => appenders.length > 0)
        .getOrCall(
      () => {
        this.state.appenders.push(new ConsoleAppender())
        return this.state.appenders
      }
      
      
    )
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
    persistentAppenders.push(...asOption(newAppenders)
      .getOrElse([]))
  }
  
  
  setRootLevel(newLevel: LevelKind) {
    this.state.rootLevel = newLevel
  }
  
  
  
  fire(record: LogRecord<Record>) {
    this.appenders.forEach(appender => appender.append(record as Record))
  }

  getLogger(
    categoryOrFilename: string,
    shouldInterpretFilename: boolean = true
  ): Logger {
    const category = shouldInterpretFilename
      ? interpretFilename(categoryOrFilename)
      : categoryOrFilename
    return asOption(category)
      .map((category) => this.loggers.get(category))
      .getOrCall(() => {
        const logger = new Logger(this, category)
        this.loggers.set(category, logger)
        return logger
      })
  }

  private constructor() {}

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
