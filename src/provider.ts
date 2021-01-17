import { ILogger, ILoggerEvent, Level } from "./types"

export type LoggingManager = {
  onMessage: (message: ILoggerEvent) => void | false
}




const loggerState = {
  loggingManager: undefined as LoggingManager
}

export function setLoggingManager(newLoggingProvider: LoggingManager) {
  loggerState.loggingManager = newLoggingProvider
}




export function getLoggingManager(): LoggingManager {
  return loggerState.loggingManager
}

