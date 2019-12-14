import { styler as DefaultStyler } from "./DefaultStyler"
import { warnLog, getProp, parseLogLevel, formatValue } from "./Util"
import { Formatter, TCategoryLevels, LogLevel, Logger, LogLevelNames, Config } from "./Types"
import { setConfig } from "./Config"





/**
 * Set global threshold
 *
 * @param level
 */
export function setRootThreshold(threshold:LogLevel): Config {
  return setConfig({threshold})
}

/**
 * Current logger output
 */
let loggerOutput:Logger = new Proxy(console, {
  get(target, prop) {
    if (prop ===
      "name" &&
      !(
        target as any
      ).name)
      return "console"
    
    return target[prop]
  }
}) as any

// Does process object exist
const
  hasProcess = typeof process === "undefined"

// If in development env then add a few helpers
if (hasProcess && getProp(process, "env.NODE_ENV") === "development") {
  Object.assign(global as any, {
    debugCat(cat:string) {
      try {
        process.env.LOG_DEBUG =
          (
            process.env.LOG_DEBUG || ""
          ) + "," + cat
      } catch (err) {
        warnLog(`Failed to set cat debugging: ${cat}`, err)
      }
    }
  })
}

/**
 * Is debugging enabled for a category
 * based on comma delimited string
 *
 * @param envVal
 * @param name
 * @param delimiter
 * @returns {boolean}
 */
function stringIncludes(envVal:string, name:string, delimiter:string = ","):boolean {
  return (
    !envVal
  ) ? false :
    envVal
      .split(delimiter)
      .map(val => val.toLowerCase())
      .includes(name.toLowerCase())
}

// /**
//  * Check if a category has debugging
//  *
//  * @param name
//  * @returns {boolean}
//  */
// function checkDebug(name:string):boolean {
// 	if (!hasProcess)
// 		return false
//
// 	const envDEBUG = getProp(process,'env.DEBUG'),
// 		envLOG_DEBUG = getProp(process,'env.LOG_DEBUG') || ''
//
//
// 	return stringIncludes(envDEBUG,name) || stringIncludes(envLOG_DEBUG,name)
// }

const
  overrideLevels = {} as any

/**
 * Set an override threshold for a logger
 *
 * @param logger
 * @param overrideLevel
 */
export function setOverrideLevel(logger:Logger, overrideLevel:LogLevel) {
  overrideLevels[logger.name] = overrideLevel
}

/**
 * Generic log action
 *
 * @param logger
 * @param name
 * @param level
 * @param args
 */
function log(logger:Logger, name, level, ...args):void {
  let overrideLevel = overrideLevels[logger.name]
  
  if (typeof overrideLevel !== "number")
    overrideLevel = -1
  
  const
    msgLevel = parseLogLevel(level),
    catLevel = categoryLevel(name)
  
  if (overrideLevel >
    msgLevel ||
    (
      overrideLevel ===
      -1 &&
      (
        (
          catLevel > 0 && msgLevel < catLevel
        ) ||
        (
          catLevel < 1 && msgLevel < logThreshold
        )
      )
    ))
    return
  
  const
    logOut = loggerOutput as any,
    logFns = [
      logOut[level] ? (...msgArgs) => {
        logOut[level](...msgArgs)
      } : null,
      logOut.log ? logOut.log.bind(logOut) : null,
      logOut
    ]
  
  let
    logFn = null
  
  for (logFn of logFns) {
    if (logFn && typeof logFn === "function")
      break
  }
  
  if (!logFn) {
    throw new Error("Logger output can not be null")
  }
  
  const
    textMsg = formatValue(args.shift())
  
  if (stylerEnabled && styler) {
    styler(logFn, `${globalPrefix || ""}${name}`, level, ...args)
  } else {
    logFn(`${globalPrefix || ""}[${name}] [${level.toUpperCase()}] ${textMsg}`, ...args)
  }
}

/**
 * Default log factory, uses console
 */
export const DefaultLoggerFactory = {
  
  /**
   * Creates a simple logger, parsing
   * provided category as a simple filename
   * and using the current output for output
   *
   * @param name
   * @returns {Logger}
   */
  create(name:string):Logger {
    name = name.split("/").pop().split(".").shift()
    
    const
      logger:Logger = { name } as any
    
    // Create levels
    LogLevelNames.reduce((logger, level) => {
      logger[level] = (...args) => {
        log(logger as any, name, level, ...args)
      }
      
      return logger
    }, logger)
    
    // ADD THE OVERRIDE FUNCTION
    logger.setOverrideLevel = (level:LogLevel) => {
      setOverrideLevel(logger, level)
    }
    
    
    return logger
    
  }
}

/**
 * Set the logger output
 *
 * @param newLoggerOutput
 */
export function setLoggerOutput(newLoggerOutput:Logger) {
  loggerOutput = newLoggerOutput
}


/**
 * Create a new logger
 *
 * @param name
 * @returns {Logger}
 */
export function create(name:string) {
  return null
}
