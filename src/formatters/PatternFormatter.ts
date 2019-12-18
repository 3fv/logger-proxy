import { Config, Formatter, Entry, LevelName, Color, Level, Nullable, StackData, AppenderTemplateFn } from "../Types"
import * as moment from "moment"
import * as chalk from "chalk"
import { defaultsDeep, memoize, isEmpty, isError, get, defaultTo } from "lodash"
import { inspect } from "util"
import { buildString, getThresholdValue } from "../util/CoreUtil"
import { Option } from "@3fv/prelude-ts"
import { If, Run } from "../util/FpTools"
import { isString } from "@3fv/guard"

const DefaultCategoryName = "ROOT"

export type PatternFormatterTemplateArgs = Omit<Entry, "timestamp"> & {
  timestampFormatted:string
  showCategory:boolean
  showTimestamp:boolean
  showError:boolean
  showLoggerName: boolean
  showStackDataAlways: boolean
  showArgs:boolean
  color:(text:string) => string
  error:Nullable<Error>
}

export type PatternTemplateData = AppenderTemplateFn<PatternFormatterTemplateArgs>

export interface PatternFormatterConfig {
  timestampFormat:string
  template:(data:PatternTemplateData) => string
  useColor:boolean
  showArgs:boolean
  showStackDataAlways: boolean
  showCategory:boolean
  showLoggerName:boolean
  showTimestamp:boolean
  showError:boolean
  colors:Record<LevelName, Color | string>
}

export const defaultPatternFormatterConfig:PatternFormatterConfig = {
  timestampFormat: "HH:mm:ss",
  showCategory: true,
  showLoggerName: true,
  showTimestamp: true,
  showStackDataAlways: false,
  showError: true,
  showArgs: true,
  //logFn(`${globalPrefix || ""}[${name}] [${level.toUpperCase()}] ${textMsg}`, ...args)
  template: data => {
    const
      {
        timestampFormatted,
        level,
        message,
        color,
        args,
        stackData,
        showLoggerName,
        showCategory,
        showTimestamp,
        showError,
        showArgs,
        showStackDataAlways,
        logger: {basename: loggerName},
        category,
        error
      } = data,
      stackDataPath = Option.ofNullable(stackData)
      .map(({ path }:StackData) =>
        Option.of(path.indexOf("file:"))
          .filter(index => index > -1)
          .map(index => path.substr(index + 5, path.length))
          .getOrUndefined()
      )
      .getOrUndefined(),
    
    categoryName = Option
      .ofNullable(category.name)
      .match({
        Some: it => it,
        None: () => !stackDataPath ?
          DefaultCategoryName :
          Option.of(stackDataPath.split("/"))
            .map(parts =>
              parts.length < 3 ?
                stackDataPath :
                parts[parts.length - 3].replace(/\.[a-zA-Z0-9]+$/, "")
            )
            .get()
        
      }),
      name = (showCategory || showLoggerName) ? `(${Run(() => {
        const parts = [
          If(showCategory, defaultTo(categoryName, DefaultCategoryName)),
          If(showLoggerName, loggerName, null)
        ]
        
        return buildString(
        parts.filter(isString),
        ":"
      )})})` : ""
    
    return color(
      buildString([
        // TIMESTAMP
        showTimestamp ? timestampFormatted : "",
        
        // LEVEL
        `[${level.toUpperCase()}]`,
        
        // CATEGORY/LOGGER
        name,
        
        // STACK DATA
        (showStackDataAlways || getThresholdValue(level) >= getThresholdValue(Level.warn)) && buildString([
          stackData ?
            [
              `${stackDataPath}:${stackData.line}:${stackData.pos}`,
              isEmpty(stackData.method) ? "" : ` ${stackData.method}`
            ] :
            []
        ], ""),
        
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
          , "")
      ].filter(isString), " ")
    )
  },
  
  useColor: true,
  colors: {
    trace: "grey",
    debug: "blue",
    info: "green",
    warn: "yellow",
    error: "red",
    fatal: "redBright"
  }
}

export class PatternFormatter implements Formatter<PatternFormatterConfig> {
  
  readonly config:PatternFormatterConfig
  
  constructor(config:Partial<PatternFormatterConfig> = {}) {
    this.config = defaultsDeep(config, defaultPatternFormatterConfig)
  }
  
  setConfig(newConfig:Partial<PatternFormatterConfig>):this {
    Object.assign(this.config, defaultsDeep(newConfig, defaultPatternFormatterConfig))
    return this
  }
  
  private color = memoize((level:Level) => {
    const
      color = this.config.colors[level],
      prefix = `${color} `,
      suffix = ``
    return (text:string) => chalk`{${prefix} ${text}${suffix}}`
  })
  
  format(entry:Entry, config:Config):[string, Array<any>] {
    const
      { config: formatterConfig } = this,
      { template, showError, showStackDataAlways, showLoggerName, timestampFormat, showArgs, showCategory, showTimestamp } = formatterConfig,
      timestampFormatted = moment(entry.timestamp).format(timestampFormat)
    let { level, args } = entry
    
    const
      color = this.color(level),
      error = args.find(isError)
    
    if (!!error) {
      args = args.filter(it => it !== error)
    }
    const
      params:PatternTemplateData = {
        ...entry,
        level,
        timestampFormatted,
        color,
        showLoggerName,
        showTimestamp,
        showCategory,
        showArgs,
        showError,
        showStackDataAlways,
        args,
        error
      }
    let
      output = template(params)
    
    
    return [output, entry.args]
  }
  
  
}