import { getLogger } from "../getLogger.js"
import { LevelNames } from "../Level.js"
import { getLoggingManager } from "../LoggingManager.js"
import Debug from "debug"
import { DebugAppender } from "./DebugAppender.js"
import { FileAppender } from "./FileAppender.js"
import range from "lodash/range.js"
import { Deferred } from "@3fv/deferred"
import * as Sh from "shelljs"
import * as Path from "path"
import * as Fs from "fs"
import {faker as Faker} from "@faker-js/faker"

const debug = Debug("3fv:logger:FileAppender")
const logMatch = /app\.log/
const countLogFiles = (dir: string, match: RegExp = /.*/) =>
  Sh.ls(dir).filter((name) => match.test(name)).length
const osTempDir = process.env.TMP ?? process.env.TEMP ?? "/tmp"

describe("FileAppender", () => {
  jest.setTimeout(10000)

  it("rolls", async () => {
    const tempDir = Fs.mkdtempSync(Path.join(osTempDir, "jest-logger-proxy")) //
    Sh.mkdir("-p", tempDir)
    Sh.rm("-Rf", `${tempDir}/*`)
    const filename = Path.join(tempDir, "app.log")

    if (countLogFiles(tempDir, logMatch)) {
      Sh.rm("-f", filename + "*")
    }

    expect(countLogFiles(tempDir, logMatch)).toBe(0)
    debug(`Using filename ${filename}`)
    const manager = getLoggingManager()
    const fileAppender = new FileAppender({
      enableRolling: true,
      maxFiles: 5,
      maxSize: 2048,
      filename
    })
    manager
      .setAppenders(fileAppender)

      .setRootLevel("trace")

    const log = getLogger(__filename)
    //
    for (const i of range(0, 5)) {
      LevelNames.forEach((name) =>
        log[name].call(log, `${i} example `, Faker.lorem.sentences(5))
      )
      await Deferred.delay(500)
    
      LevelNames.forEach((name) =>
        log[name].call(log, `${i} example `, Faker.lorem.sentences(2))
      )
      await Deferred.delay(500)
    
      // fileAppender.rollFile()
    }

    await fileAppender.close()

    expect(countLogFiles(tempDir, logMatch)).toBe(5)
  })

  it("does not create a temp directory when imported, only when no filename is given", () => {
    const countDefaultDirs = () =>
        Sh.ls(osTempDir).filter((name) => name.startsWith("logger-proxy-example")).length,
      before = countDefaultDirs(),
      tempDir = Fs.mkdtempSync(Path.join(osTempDir, "jest-logger-proxy"))

    new FileAppender({ filename: Path.join(tempDir, "app.log") })
    expect(countDefaultDirs()).toBe(before)

    new FileAppender()
    expect(countDefaultDirs()).toBe(before + 1)
  })

  it("flush writes every appended record, in order", async () => {
    const tempDir = Fs.mkdtempSync(Path.join(osTempDir, "jest-logger-proxy")),
      filename = Path.join(tempDir, "app.log"),
      fileAppender = new FileAppender<any>({ filename, prettyPrint: false }),
      messages = range(0, 200).map((i) => `message ${i}`)

    messages.forEach((message) => fileAppender.append({ message }))
    await fileAppender.flush()

    expect(
      Fs.readFileSync(filename, "utf-8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line).message)
    ).toEqual(messages)
    await fileAppender.close()
  })

  it("is flushed by the logging manager", async () => {
    const tempDir = Fs.mkdtempSync(Path.join(osTempDir, "jest-logger-proxy")),
      filename = Path.join(tempDir, "app.log"),
      manager = getLoggingManager()

    manager
      .setAppenders(new FileAppender({ filename, prettyPrint: false }))
      .setRootLevel("trace")
    getLogger(__filename).info("last record before exit")
    await manager.flush()

    expect(Fs.readFileSync(filename, "utf-8")).toContain("last record before exit")
  })
})
