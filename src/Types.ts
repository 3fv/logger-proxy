import { Option } from "@3fv/prelude-ts"

export type Nullable<T> = T | undefined | null

export interface Category {
  threshold:LogLevel
  name:string
}

export interface Config {
  threshold:LogLevel
  formatter:Formatter
  categories:Category[]
  appenders:Appender<any>[]
  stack:{
    removeFrames:number  //Defaults to #
    enabled:boolean
  }
  
}

export type StackDataProviderFn = (event:Partial<Entry>, config:Config) => StackData


export interface StackData {
  enabled:boolean
  method?:Nullable<string>
  path?:Nullable<string>
  pos?:Nullable<string>
  line?:Nullable<string>
}

export interface Entry {
  timestamp:number
  level:LogLevel
  threshold:number
  category:Category
  message:string
  args:any[]
  stackData:StackData
}


export interface Appender<AppenderConfig> {
  readonly id:string
  readonly type:string
  append:(entry:Entry, config:Config) => void
  setFormatter?:(formatter:Nullable<Formatter>) => void
  getFormatter?:() => Nullable<Formatter>
}


export interface Formatter<FormatterConfig = {}, Output extends string = string> {
  config:FormatterConfig
  format:(entry:Entry, config:Config) => [Output, Array<any>]
}


/**
 * Log level names
 *
 * @type {(string|string|string|string)[]}
 */


export type TCategoryLevels = { [name:string]:LogLevel }

/**
 * Log level values
 */
export enum LogLevel {
  trace = "trace",
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
  fatal = "fatal"
}

export type LogLevelName = keyof typeof LogLevel

export const LogLevelNames:Array<LogLevelName> = Object.values(LogLevel)


/**
 * Logger interface
 *
 * @export
 * @interface Logger
 */
export type Logger = {
  name:string
  setOverrideLevel:(level:LogLevel) => void
} & {
	[Level in LogLevelName]: (message: string, ...args:any[]) => void
}


/**
 Basic foreground colors.
 
 [More colors here.](https://github.com/chalk/chalk/blob/master/readme.md#256-and-truecolor-color-support)
 */
export type ForegroundColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray"
  | "grey"
  | "blackBright"
  | "redBright"
  | "greenBright"
  | "yellowBright"
  | "blueBright"
  | "magentaBright"
  | "cyanBright"
  | "whiteBright";

/**
 Basic background colors.
 
 [More colors here.](https://github.com/chalk/chalk/blob/master/readme.md#256-and-truecolor-color-support)
 */
export  type BackgroundColor =
  | "bgBlack"
  | "bgRed"
  | "bgGreen"
  | "bgYellow"
  | "bgBlue"
  | "bgMagenta"
  | "bgCyan"
  | "bgWhite"
  | "bgGray"
  | "bgGrey"
  | "bgBlackBright"
  | "bgRedBright"
  | "bgGreenBright"
  | "bgYellowBright"
  | "bgBlueBright"
  | "bgMagentaBright"
  | "bgCyanBright"
  | "bgWhiteBright";

/**
 Basic colors.
 
 [More colors here.](https://github.com/chalk/chalk/blob/master/readme.md#256-and-truecolor-color-support)
 */
export  type Color = ForegroundColor | BackgroundColor;
