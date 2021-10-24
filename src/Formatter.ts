
import { LogRecord } from "./LogRecord"

export type Formatter<
Output = string,
RecordOptions extends {} = {},
Data = any
> = (entry: LogRecord<Data>, options?: RecordOptions) => Output
