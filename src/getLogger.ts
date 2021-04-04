import { getLoggingManager } from "./LoggingManager"
import { Logger } from "./Logger"


export function getLogger(category: string, interpretFilename: boolean = true):Logger {
  return getLoggingManager().getLogger(category,interpretFilename)
}
