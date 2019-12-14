import { Config, Formatter, Entry, LevelName, Color, Level, Nullable } from "../Types"
import Handlebars, { TemplateDelegate } from "handlebars"
import * as moment from "moment"
import * as chalk from "chalk"
import { defaultsDeep, memoize, isEmpty, isError } from "lodash"
import { inspect } from "util"
import { buildString } from "../util/CoreUtil"

export type PatternFormatterTemplateArgs = Omit<Entry, "timestamp"> & {
  timestamp: string
  showCategory: boolean
  showTimestamp: boolean
  showError: boolean
  showArgs: boolean
  color: (text: string) => string
  error: Nullable<Error>
}

export interface PatternFormatterConfig {
  timestampFormat: string
  template: (data: PatternFormatterTemplateArgs) => string
  useColor: boolean
  showArgs: boolean
  showCategory: boolean
  showTimestamp: boolean
  showError: boolean
  colors: Record<LevelName, Color | string>
}

export const defaultPatternFormatterConfig: PatternFormatterConfig = {
  timestampFormat: "HH:mm:ss",
  showCategory: true,
  showTimestamp: true,
  showError: true,
  showArgs: true,
  //logFn(`${globalPrefix || ""}[${name}] [${level.toUpperCase()}] ${textMsg}`, ...args)
  template: ({
    timestamp,
    level,
    message,
    color,
    args,
    stackData,
    showCategory,
    showTimestamp,
    showError,
    showArgs,
    category: { name: category },
    error
  }) =>
    color(
      buildString([
        // TIMESTAMP
        showTimestamp ? timestamp : "",
  
        // LEVEL
        `[${level.toUpperCase()}]`,
  
  
        // CATEGORY/LOGGER
        showCategory ? `(${category})` : "",
        
        
        // STACK DATA
        buildString([
          stackData ?
            [
              `${stackData.path}:${stackData.line}:${stackData.pos}`,
              isEmpty(stackData.method) ? "" : ` ${stackData.method}`
            ] :
            []
        ],""),
        
        // MESSAGE
        message,
        
        // ARGS
        !showArgs && Array.isArray(args) ?
          "" :
          args.map(arg => inspect(arg)).join(" "),
        
        // ERROR
        buildString(
          showError && !!error ? [
            "\n",
            error.message,
            "\n",
            error.stack
          ] : []
        ,"")
      ]," ")
    ),
  
  useColor: true,
  colors: {
    trace: "grey",
    debug: "white",
    info: "whiteBright",
    warn: "yellow",
    error: "red",
    fatal: "redBright"
  }
}

export class PatternFormatter implements Formatter<PatternFormatterConfig> {
  
  readonly config: PatternFormatterConfig
  
  constructor(config: Partial<PatternFormatterConfig> = {}) {
    this.config = defaultsDeep(config, defaultPatternFormatterConfig)
  }
  
  setConfig(newConfig: Partial<PatternFormatterConfig>): this {
    Object.assign(this.config, defaultsDeep(newConfig, defaultPatternFormatterConfig))
    return this
  }
  
  private color = memoize((level: Level) => {
    const
      color = this.config.colors[level],
      prefix = `${color} `,
      suffix = ``
    return (text: string) => chalk`{${prefix} ${text}${suffix}}`
  })
  
  format(entry: Entry, config: Config): [string, Array<any>] {
    const
      { config: formatterConfig } = this,
      { template,showError, timestampFormat, showArgs, showCategory, showTimestamp } = formatterConfig,
      timestamp = moment(entry.timestamp)
        .format(timestampFormat)
    let { level, args } = entry
    
    const
      color = this.color(level),
      error = args.find(isError)
      
      if (!!error) {
        args = args.filter(it => it !== error)
      }
      const
      params = {
        ...entry,
        level,
        timestamp,
        color,
        showTimestamp,
        showCategory,
        showArgs,
        showError,
        args,
        error
      }
    let
      output = template(params)
    
    
    
    return [output, entry.args]
  }
  
  
}