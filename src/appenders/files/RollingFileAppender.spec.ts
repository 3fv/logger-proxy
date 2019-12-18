import "jest"
import { Config, Level, LogFactory, Logger, Nullable } from "../../Types"
import { configure } from "../../Config"
import * as Path from "path"
import { Deferred } from "../../util/Deferred"
import { RollingFileAppender } from "./RollingFileAppender"
import { range } from "lodash"
import * as moment from "moment"
import { cleanup, getLogFiles, TestLogDir } from "../../test/test-utils"

let config: Nullable<Config> = null
let factory: Nullable<LogFactory> = null
let log: Nullable<Logger>  = null
let rollingFileAppender: Nullable<RollingFileAppender> = null

const rollingFileTestTimeout = 180000
jest.setTimeout(rollingFileTestTimeout)
let maxFiles = 2

beforeEach(async () => {

  await cleanup(config, "rolling")

  factory = configure()
    .appenders([
      rollingFileAppender = new RollingFileAppender("rolling-file", {
        filename: (index: number = -1) => {
          const file = Path.join(TestLogDir, index > -1 ?
          `spec.rolling.file.appender.${index}.log` :
          "spec.rolling.file.appender.log")
          return file
        },
        maxFiles,
        maxSize: 1
      })
    ])
    .rootLevel(Level.trace)
    .getFactory()
  log = factory.getLogger(__filename)
  config = factory.getConfig()

  maxFiles++
})

test("#rolling-2-files-with-100k-entries", async () => {
  expect(log).not.toBeNull()

  let logFiles = getLogFiles("rolling")
  expect(logFiles.length).toBe(0)

  for await (const index of range(0,100000)) {
    log.info(`Message ${index}`)
    if (index % 1000 === 0) {
      console.info(`Wrote ${index} so far`)
      await Deferred.delay(100)
    }
  }


  console.info("Checking files every 10s")
  const startTime = Date.now()
  let duration: number
  while ((logFiles = getLogFiles("rolling")).length < 2 && (duration = Date.now() - startTime) < rollingFileTestTimeout - 20000 /* give a little buffer */) {
    console.info(`File count (${logFiles.length}) duration (${moment.duration(duration).asSeconds()})`)
    await Deferred.delay(10000)
  }

  logFiles = getLogFiles("spec.rolling")
  expect(logFiles.length).toBe(2)

})

test("#rolling-3-files-with-200k-entries", async () => {
  // const appender = config.appenders[0] as RollingFileAppender
  // appender.
  expect(log).not.toBeNull()

  let logFiles = getLogFiles("rolling")
  expect(logFiles.length).toBe(0)

  for await (const index of range(0,200000)) {
    log.info(`Message ${index}`)
    if (index % 1000 === 0) {
      console.info(`Wrote ${index} so far`)
      await Deferred.delay(100)
    }
  }


  console.info("Checking files every 10s")
  const startTime = Date.now()
  let duration: number
  while ((logFiles = getLogFiles("rolling")).length < 3 && (duration = Date.now() - startTime) < rollingFileTestTimeout - 20000 /* give a little buffer */) {
    console.info(`File count (${logFiles.length}) duration (${moment.duration(duration).asSeconds()})`)
    await Deferred.delay(10000)
  }

  logFiles = getLogFiles("spec.rolling")
  expect(logFiles.length).toBe(3)

})