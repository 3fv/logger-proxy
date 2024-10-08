import { LogRecord } from "./LogRecord.js"

export interface Appender<Record extends LogRecord = any> {
  append(record: Record): void
}
