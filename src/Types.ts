import { Option } from "@3fv/prelude-ts"
import { defaultsDeep } from "lodash"

export type Nullable<T> = T | undefined | null

export interface CategoryConfig {
  appenderIds?: Nullable<string[]>
  threshold?: Nullable<Level>
}

const defaultCategoryConfig: CategoryConfig = {
  appenderIds: null,
  threshold: null
}

export class Category {
  
  private static categories = new Map<string, Category>()
  
  static get(name: string): Category {
    const {categories} = this
    if (!categories.has(name)) {
      categories.set(name,new Category(name))
    }
    
    return this.categories.get(name)
  }
  
  private readonly state:{
    config: CategoryConfig
  }
  
  get config(): CategoryConfig {
    return this.state.config
  }
  
  get threshold(): Level{
    return this.state.config.threshold
  }
  
  constructor(
    readonly name:string,
    config: Partial<CategoryConfig> = {}
  ) {
    this.state = {
      config: defaultsDeep({...config}, defaultCategoryConfig)
    }
  }
  
  
  
  setConfig(newConfig: Partial<CategoryConfig>): this {
    const {config} = this.state
    Object.assign(this.state, {
      config: defaultsDeep(newConfig, {...config})
    })
    
    return this
  }
  
  
}

export interface Config {
  threshold:Level
  formatter:Formatter
  appenders:Appender<any>[]
  
  stack:{
    provider: StackDataProvider
    root: string
    removeFrames:number  //Defaults to #
    enabled:boolean
  }
  
}

export type StackDataProvider = (entry:Partial<Entry>, config:Config) => Nullable<StackData>

export interface AppenderConfig {
  threshold?: Nullable<Level>
}

export interface StackData {
  method?:Nullable<string>
  path?:Nullable<string>
  folder?:Nullable<string>
  file?:Nullable<string>
  pos?:Nullable<string>
  line?:Nullable<string>
  stack?: Array<string>
}

export interface Entry {
  timestamp:number
  level:Level
  threshold:number
  logger: Logger
  category:Category
  message:string
  args:any[]
  stackData?:Nullable<StackData>
}


export interface Appender<AppenderConfig> {
  readonly id:string
  readonly type:string
  append:(entry:Entry, config:Config) => void
  close:() => Promise<void>
  
  setFormatter?:(formatter:Nullable<Formatter>) => void
  getFormatter?:() => Nullable<Formatter>
  
}


export interface Formatter<FormatterConfig = {}, Output extends string = string> {
  config:FormatterConfig
  format:(entry:Entry, config:Config) => [Output, Array<any>]
}


/**
 * Log level values
 */
export enum Level {
  trace = "trace",
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
  fatal = "fatal"
}

export type LevelName = keyof typeof Level

export const LevelNames:Array<LevelName> = Object.values(Level)


/**
 * Logger interface
 *
 * @export
 * @interface Logger
 */
export type Logger = {
	[Level in LevelName]: (message: string, ...args:any[]) => void
} & {
  path: string
  basename: string
  category: Category
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
