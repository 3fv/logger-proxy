import { Config } from "../Types"
import { test, find, rm } from "shelljs"
import { Deferred } from "../util/Deferred"
import { mkdirp } from "../util/ShellUtil"

export const TestLogDir = "/tmp/3fv-logger-test"



if (test("-e", TestLogDir)){
  rm("-Rf", TestLogDir)
}
mkdirp(TestLogDir)

let testIndex = 0

export function getNextTestIndex() {
  return testIndex++
}

export function getLogFiles(prefix: string) {
  const regex = new RegExp(`${prefix}\\..*\\.log$`)
  const allFiles = find(TestLogDir),
  filteredFiles = !Array.isArray(allFiles) ? [] : allFiles.filter(it => it.includes(prefix) || regex.test(it))
  return filteredFiles
}


export const cleanup = async (config: Config,prefix: string) => {
  if (!!config)
    await Promise.all(config.appenders.map(it => it.close()))
  
  const
    filesToClean = getLogFiles(prefix)
  console.info(`Cleaning`, filesToClean)
  if(filesToClean.length) {
    rm(filesToClean)
    await Deferred.delay(500)
  }
  
}
