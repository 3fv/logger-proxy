import {
  Level,
  LevelKind,
  LevelThresholds,
  LogHandler,
  LogRecord
} from "./types"
import { asOption } from "@3fv/prelude-ts"
import { ConsoleLogHandler } from "./ConsoleLogHandler"
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
  handler: LogHandler<Record>
}

/**
 * Logging manager
 */
export class LoggingManager<Record extends LogRecord = any> {
  readonly loggers = new Map<string, Logger>()

  readonly state: LoggingManagerState<Record> = {
    handler: undefined,
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
   * @returns {LogHandler<Record>}
   */
  get handler(): LogHandler<Record> {
    return asOption(this.state.handler).getOrCall(
      () => (this.state.handler = new ConsoleLogHandler())
    )
  }

  /**
   * Set the handler explicitly
   *
   * @param {LogHandler<Record>} newHandler
   */
  set handler(newHandler: LogHandler<Record>) {
    this.state.handler = newHandler
  }

  fire(record: LogRecord<Record>) {
    this.handler.handle(record as Record)
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
