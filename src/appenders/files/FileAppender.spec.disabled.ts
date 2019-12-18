import "jest"
import { Config, Level, LogFactory, Logger, Nullable } from "../../Types"
import { configure } from "../../Config"
import { FileAppender } from "./FileAppender"
import * as Path from "path"
import { Deferred } from "../../util/Deferred"
import { cleanup, getLogFiles, TestLogDir } from "../../test/test-utils"

let config: Nullable<Config> = null
let factory: Nullable<LogFactory> = null
let log: Nullable<Logger>  = null

beforeEach(async () => {
  await cleanup(config, "spec.file")
  
  factory = configure()
    .appenders([
      new FileAppender("file", {
        filename: (index: number = -1) => Path.join(TestLogDir, index > -1 ?
          `spec.file.appender.${index}.log` :
          "spec.file.appender.log")
      })
    ])
    .rootLevel(Level.trace)
    .getFactory()
  log = factory.getLogger(__filename)
  config = factory.getConfig()
})

test("#check logs are being written", async () => {
  expect(log).not.toBeNull()
  
  Object.values(Level).forEach(level => {
    log[level].apply(log, [`testing level ${level}`])
  })
  
  log.info("Sleeping for 500 millis before checking")
  await Deferred.delay(1000)
  
  const logFiles = getLogFiles("spec.file")
  
  expect(logFiles.length).toBe(1)
  
})