import { LogRecord } from "./LogRecord.js"

export interface Appender<Record extends LogRecord = any> {
  append(record: Record): void

  /**
   * Write any buffered records to their destination,
   * implemented by appenders which write asynchronously
   *
   * @returns a promise resolved once everything appended so far is written
   */
  flush?(): Promise<void>
}
