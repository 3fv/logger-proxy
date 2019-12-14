import { Option } from "@3fv/prelude-ts"
import { Level, LevelName, LevelNames } from "../Types"
import { flatten } from "lodash"
import { isString } from "@3fv/guard"

export function stringify(value:any) {
  try {
    const args:[string,Array<string> | undefined] = [value,undefined]
    
    if (value instanceof Error) {
      args.push(["message", "stack", "type", "name"])
    }
    
    return JSON.stringify(...args)
    
  } catch (e) {
    return "[Circular]"
  }
  
}


/**
 * Warn logging message
 *
 * @param msg
 * @param err
 */
export function warnLog(msg:string, err:Error) {
  try {
    console.warn(msg, err)
  } catch (err2) {
  }
}


/**
 * Parse log level
 *
 * @param level
 * @returns {any}
 */
export function parseLogLevel(level:string) {
  let logLevel:any = Level.debug
  try {
    logLevel = Level[level.toUpperCase() as any]
  } catch (err) {
    warnLog(`Failed to parse log level ${level}`, err)
    logLevel = Level.debug
  }
  
  return logLevel
}

/**
 * Format a message value
 *
 * @param value
 * @returns {string}
 */
export function formatValue(value) {
  const
    valueType = typeof value
  
  return (
    ["number", "string", "boolean"].indexOf(valueType) > -1
  ) ?
    value : JSON.stringify(value, null, 4)
}

/**
 * Get a deep property
 *
 * @param obj
 * @param keyPath
 * @returns {any}
 */
export function getProp(obj, keyPath) {
  if (!obj)
    return null
  
  const
    keyParts = keyPath.split("."),
    key = keyParts.shift(),
    val = obj[key]
  
  return (
    keyParts.length
  ) ? getProp(val, keyParts.join(".")) : val
}


const thresholdValueMap = LevelNames.reduce((map, level, index) =>
    map.set(level, index)
  , new Map<LevelName,number>())

export function getThresholdValue(level:Level):number {
  return Option.of(thresholdValueMap.get(level))
    .getOrThrow()
}

export type BuildStringArg = Array<string | string[] | Array<BuildStringArg>>

export function buildString(src: BuildStringArg,joinWith: string = " "): string {
  let dest:any[] = [...src]
  while(dest.some(it => Array.isArray(it))) {
    dest = flatten(dest)
  }
  
  return dest.join(joinWith)
}

export function pathToBasename(path: string): string {
  return path.split("/").pop().replace(/\.[a-z]+$/,"")
}