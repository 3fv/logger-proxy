import { getLoggingManager } from "./LoggingManager"
import { Logger } from "./Logger"
import { LoggerOptions } from "."

export function getLogger(
  category: string,
  options: Partial<LoggerOptions> = {}
): Logger {
  return getLoggingManager().getLogger(category, options)
}
