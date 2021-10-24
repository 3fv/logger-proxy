import { LogRecord } from "../LogRecord"
import { Appender } from "../Appender"
import { LevelKind } from "../Level"
import Debug from "debug"
import {
  ConsoleAppenderConfig,
  ConsoleAppender,
  kDefaultConsoleAppenderConfig
} from "./ConsoleAppender"
import { Formatter } from "../Formatter"
import { isEmpty, negate } from "lodash"
import type ChalkType from "chalk"
import { asOption } from "@3fv/prelude-ts"
import { assert, isFunction } from "@3fv/guard"

let chalk: ChalkType.Chalk = null
if (
  typeof process !== "undefined" &&
  (process as any).type !== "renderer" &&
  (process as any).browser !== true
) {
  chalk = require("chalk")
}

const useColors = !!chalk

const makeColorFn = (fn: (chalk: ChalkType.Chalk, s: string) => string) => {
  if (!useColors) {
    return (s: string) => s
  }

  //const fn = chalk[color] as Function
  //assert(isFunction(fn), `chalk.${color} is not a function`)

  return (s: string) => fn(chalk, s)
}

const colorFns: Record<LevelKind, (s: string) => string> = {
  debug: makeColorFn((c, s) => c.green(s)),
  error: makeColorFn((c, s) => c.red(s)),
  fatal: makeColorFn((c, s) => c.bgRed.black(s)),
  info: makeColorFn((c, s) => c.blue(s)),
  trace: makeColorFn((c, s) => c.gray(s)),
  warn: makeColorFn((c, s) => c.yellow(s))
}

/**
 * DebugAppender Configuration
 */
export interface DebugAppenderConfig extends ConsoleAppenderConfig {
  levels: LevelKind[]
  hideDate: boolean
}

/**
 * Partial of config, used for shortening instead of Partial<...>
 */
export type DebugAppenderOptions = Partial<DebugAppenderConfig>

const debuggers = new Map<string, Debug.Debugger>()

const debugAppPrefix = "app"

function getDebug(cat: string) {
  let debug = debuggers.get(cat)
  if (!debug) {
    debug = Debug([debugAppPrefix, cat].join(":"))
    debuggers.set(cat, debug)
  }

  return debug
}

/**
 *
 * Get ISO date if `hideDate !== true`
 *
 * @param {DebugFormatterContext}
 * @returns
 */
function getDate({ config }: DebugFormatterContext) {
  if (config.hideDate) {
    return ""
  }
  return new Date().toISOString()
}

/**
 *
 * Formats args for output, directly based on Debug.formatArgs
 *
 * @param {DebugFormatterContext} context
 * @param {any[]} args
 */
function formatArgs(
  context: DebugFormatterContext,
  record: LogRecord,
  args: any[]
) {
  const { config, debug } = context
  const { namespace: name } = debug as any

  if (useColors) {
    const c = debug.color as any
    const colorCode = "\u001B[3" + (c < 8 ? c : "8;5;" + c)
    const prefix = `${colorCode};1m[${name}] \u001B[0m`

    args[0] = prefix + args[0].split("\n").join("\n" + prefix)
    args.push(colorCode + "m+" + Debug.humanize(debug.diff) + "\u001B[0m")
  } else {
    args[0] = [name, args[0]].filter(negate(isEmpty)).join(" ")
  }

  const msg = [getDate(context), args[0]].filter(negate(isEmpty)).join(" ")

  args[0] = colorFns[record.level](msg)
}

/**
 * Context for using `debugFormatter`
 */
export type DebugFormatterContext = {
  config: DebugAppenderConfig
  debug: Debug.Debugger
}

/**
 * Uses `debug` package for logging, very useful
 *
 * @param {LogRecord} record to format
 * @param {DebugFormatterContext} context for this formatter
 * @returns
 */
export const debugFormatter: Formatter<Array<any>, DebugFormatterContext> = (
  record,
  { debug, config }
): any[] => {
  const { level, message, data, args: argsIn, category, timestamp } = record
  const args = [colorFns[level](`(` + level.toUpperCase() + `)`) + ` ${message}`, ...argsIn]
  args[0] = Debug.coerce(args[0])

  if (typeof args[0] !== "string") {
    // Anything else let's inspect with %O
    args.unshift("%O")
  }

  // Apply any `formatters` transformations
  let index = 0
  args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    // If we encounter an escaped % then don't increase the array index
    if (match === "%%") {
      return "%"
    }
    index++
    const formatter = Debug.formatters[format]
    if (typeof formatter === "function") {
      const val = args[index]
      match = formatter.call(debug, val)

      // Now we need to remove `args[index]` since it's inlined in the `format`
      args.splice(index, 1)
      index--
    }
    return match
  })

  // Apply env-specific formatting (colors, etc.)
  formatArgs({ debug, config }, record, args)

  return args
}
// [
//   `[${category}]  (${level})  ${message}`,
//   ...(Array.isArray(args) ? args : [args])
// ]

/**
 * Default console config
 * @type {DebugAppenderConfig}
 */
const defaultConfig: DebugAppenderConfig = {
  levels: ["trace", "debug"],
  hideDate: false,
  ...kDefaultConsoleAppenderConfig,
  formatter: debugFormatter
}
/**
 * Debug appender, the simple default appender used
 * everywhere OOB
 */
export class DebugAppender<Record extends LogRecord>
  extends ConsoleAppender<Record>
  implements Appender<Record>
{
  readonly config: DebugAppenderConfig

  get levels() {
    return this.config?.levels ?? defaultConfig.levels
  }

  /**
   * Handle log records, transform, push to ES
   *
   * @param record
   */
  append(record: Record): void {
    const { level, message, args: argsIn, category } = record

    // if (!this.levels.includes(level)) {
    //   super.append(record)
    //   return
    // }

    const debug = getDebug(category) as any
    let prevTime = debug.prevTime
    // Set `diff` timestamp
    const curr = Number(new Date())
    const ms = curr - (prevTime || curr)
    debug.diff = ms
    debug.prev = prevTime
    debug.curr = curr
    debug.prevTime = curr
    const logFn = debug.log || Debug.log
    const args = debugFormatter!(record, { debug, config: this.config })
    logFn.apply(debug, args) // as any)(...args)
  }

  /**
   *
   * @param {Partial<DebugAppenderOptions>} options
   */
  constructor(options: Partial<Omit<DebugAppenderOptions, "formatter">> = {}) {
    super({
      ...defaultConfig,
      ...options,
      formatter: debugFormatter
    })
  }
}