import fromPairs from "lodash/fromPairs.js"
import uniq from "lodash/uniq.js"
import type { Level, LevelKind, LevelName } from "./Level"

export interface LogRecord<Data = any> {
  category: string
  timestamp: number
  level: LevelKind
  args?: any[]
  data?: Data
  message: string
}
