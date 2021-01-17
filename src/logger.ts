import { LevelNames } from "./types"
import { ILogger, Level } from "./types"
import { getLoggingManager, LoggingManager } from "./provider"
import { isString } from "./util"

const consoleLevelToFn = (level: string) => {
  const fn = console[level] ?? console.log
  
  return fn.bind(console)
}

const baseConsoleLogger = LevelNames.reduce(
  (logger: any, level: string) => ({
    ...logger,
    [level]: consoleLevelToFn(level),
    ["is" + level[0].toUpperCase() + level.substr(1) + "Enabled"]: () => true
  }),
  { name: undefined } as any
) as ILogger

/**
 * Create the base line logger for
 * a category
 *
 * @returns {any}
 * @param fullName
 */
const createWrappedLogger = (fullName: string) => {
  const name = fullName.split("/").pop().split(".").shift()
  
  const cache = new Map<Level, Function>()
  const getFn = (level: Level) => {
    if (!cache.has(level)) {
      cache.set(level, (...args) => {
        const manager = getLoggingManager()
        if (!!manager && manager.onMessage({
          name,
          level,
          timestamp: Date.now(),
          args,
        }) === false) {
        
        }
  
  
        const logFn = baseConsoleLogger[level]
        logFn(`[${name}] (${level})`, ...args)
      })
    }
    return cache.get(level)
  }
  return new Proxy(baseConsoleLogger, {
    get(target: ILogger, p: PropertyKey, receiver: any): any {
      const value = target[p]
      if (!isString(p) || !value || typeof value !== "function") {
        return value
      }
      const fn = value as (...args: any[]) => void
      
      
      if (LevelNames.includes(p as any)) {
        return getFn(p as Level)
      } else {
        return value
      }
    }
  })
}

export function getLogger(
  name: string
) {
  return createWrappedLogger(name)
}
