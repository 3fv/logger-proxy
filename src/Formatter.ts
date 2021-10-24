
import { LogRecord } from "./LogRecord"

export type Formatter<
Output,
RecordOptions extends {} = {},
Data = any
> = (entry: LogRecord<Data>, options?: RecordOptions) => Output
