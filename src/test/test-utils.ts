import { Config } from "../Types"
import { find, rm } from "shelljs"
import { Deferred } from "../util/Deferred"

export function getLogFiles(prefix: string) {
  const regex = new RegExp(`${prefix}\\..*\\.log$`)
  const allFiles = find("/tmp"),
  filteredFiles = allFiles.filter(it => it.includes(prefix) || regex.test(it))
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
