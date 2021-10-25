import { DebugAppender, getLogger } from "."
import { LevelNames } from "./Level"
import { getLoggingManager } from "./LoggingManager"
import Debug from "debug"

process.env.DEBUG = "*"
Debug.enable("*")

const manager = getLoggingManager()

manager.appenders = [
  new DebugAppender({
    levels: [...LevelNames]
  })
]

manager.setRootLevel("trace")

const log = getLogger(__filename)

LevelNames.forEach((name) => log[name].call(log, `example %s`, name))
