import { Config, Formatter, Entry, LogLevelName, Color } from "../Types"
import Handlebars, { TemplateDelegate } from "handlebars"
import moment from "moment"
import * as Chalk from "chalk"
import { defaultsDeep } from "lodash"
import { inspect } from "util"

export interface PatternFormatterConfig {
  timestampFormat:string
  template: (data:any) => string
  useColor:boolean
  includeArgs:boolean
  colors:Record<LogLevelName, Color | string>
}

export const defaultPatternFormatterConfig:PatternFormatterConfig = {
  timestampFormat: "HH:mm:ss",
  
  //logFn(`${globalPrefix || ""}[${name}] [${level.toUpperCase()}] ${textMsg}`, ...args)
  template: ({timestamp, level, message,category:{name}, error = ""}) =>
    `${timestamp} [${level}] (${name}) ${message} ${error}`,
  includeArgs: true,
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
  
  private readonly template:TemplateDelegate
  
  readonly config:PatternFormatterConfig
  
  constructor(config:Partial<PatternFormatterConfig> = {}) {
    config = this.config = defaultsDeep(config, defaultPatternFormatterConfig)
    this.template = Handlebars.compile(config.template)
  }
  
  format(entry:Entry, config:Config):[string, Array<any>] {
    const
      { template, config: formatterConfig } = this,
      { timestampFormat, includeArgs } = formatterConfig,
      timestamp = moment(entry.timestamp)
        .format(timestampFormat),
      params = {
        ...entry,
        timestamp
      }
    let
      output = template(params)
      
    if (includeArgs)
      output += ` ${entry.args.map(arg => inspect(arg)).join(" ")}`
    
    return [output, entry.args]
  }
  
  
}