import { fromPairs, uniq } from "lodash"
import { Level, LevelKind, LevelName } from "./Level"

export interface LogRecord<Data = any> {
  category:string
  timestamp:number
  level:LevelKind
  args?: any[]
  data?:Data
  message:string
}
