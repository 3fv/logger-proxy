import { getLogger } from "./getLogger"
import { LevelNames } from "./Level"
import { getLoggingManager } from "./LoggingManager"
import Debug from "debug"
import { DebugAppender } from "./appenders"

process.env.DEBUG = "*"
Debug.enable("*")

const manager = getLoggingManager()

manager.appenders = [
  new DebugAppender({
    
  })
]

manager.setRootLevel("trace")

const log = getLogger(__filename)

LevelNames.forEach((name) => log[name].call(log, `example %s`, name))
