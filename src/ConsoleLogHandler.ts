import { LevelKind, LogHandler, LogRecord } from "./types"

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


export class ConsoleLogHandler<Record extends LogRecord>
  implements LogHandler<Record> {
  handle(record: Record): void {
    const {level, message, data, category, timestamp} = record
    
    let logFn: Function
    if (this.cacheEnabled) {
      logFn = getConsoleLogBinding(record.level)
    } else {
      logFn = getBoundConsoleFn(record.level)
    }
  
    logFn(`[${category}] (${level})`, message, ...(Array.isArray(data) ? data : [data]))
  }

  constructor(
    public cacheEnabled: boolean = true
  ) {}
}
