import "jest"
import { Level, LogFactory, Logger, Nullable } from "../../Types"
import { configure } from "../../Config"
import { ConsoleAppender } from "../console/ConsoleAppender"

let factory: Nullable<LogFactory> = null
let log: Nullable<Logger>  = null


beforeEach(async () => {
  factory = configure()
    .appenders([
      new ConsoleAppender()
    ])
    .threshold(Level.trace)
    .getFactory()
  log = factory.getLogger(__filename)
})

test("#console", async () => {
  expect(log).not.toBeNull()
  
  Object.values(Level).forEach(level => {
    log[level].apply(log, [`testing level ${level}`])
  })
})