import {
  Appender,
  Category,
  Config,
  Formatter,
  Level,
  Entry,
  Nullable, AppenderConfig, LogFactory
} from "../Types"
import { identity, memoize } from "lodash"
import {Option} from "@3fv/prelude-ts"
import {isDefined, isFunction} from "@3fv/guard"
import { getThresholdValue } from "../util/CoreUtil"
import { ok } from "assert"
import { DefaultFormatter } from "../formatters/DefaultFormatter"

export abstract class AbstractAppender<C extends AppenderConfig = AppenderConfig> implements Appender<C> {
  
  private state:{
    config:  Nullable<C>
    formatter: Nullable<Formatter>
    factory: Nullable<LogFactory>
  } = {
    config: null,
    formatter: null,
    factory: null
  }
  
  protected getRootThreshold(): number {
    return getThresholdValue(this.factory.getConfig().rootLevel)
  }
  
  get config():C {
    return this.state.config
  }
  
  get formatter(): Formatter {
    return Option.ofNullable(this.state.formatter)
      .orElse(() =>
        Option.ofNullable(this.state.factory.getConfig().formatter)
      )
      .getOrElse(DefaultFormatter)
  }
  
  protected constructor(
    public readonly id: string,
    public readonly type: string,
    config: Nullable<AppenderConfig> = null,
    formatter: Nullable<Formatter> = null
  ) {
    
    Object.assign(this.state, {
      config: config || {},
      formatter
    })
  }
  
  get level(): Nullable<Level> {
    return this.state.config.level
  }
  
  get factory(): LogFactory {
    const {factory} = this.state
    ok(!!factory, `LogFactory not set yet`)
    return factory
  }
  
  format(entry:Entry, config:Config = this.factory.getConfig()): [string, Array<any>] {
    const {formatter} = this
    ok(isDefined(formatter) && isFunction(formatter.format), `No valid formatter available`)
    return formatter.format(entry,config)
  }
  
  setFactory(factory: LogFactory) {
    this.state.factory = factory
  }
  
  getThreshold = memoize((category: Category): number => {
    return Math.max(this.getRootThreshold(),...[
      category.level,
      this.level
    ]
      .filter(isDefined)
      .map(getThresholdValue))
    
    
  })
  
  
  getFormatter():Formatter {
    return Option.ofNullable(this.state.formatter)
      .match({
        Some: identity,
        None: () => this.factory.getConfig().formatter
      })
  }
  
  setFormatter(value:Nullable<Formatter>) {
    this.state.formatter = value
  }
  
  abstract write(entry: Entry, config: Config):void
  
  /**
   * Append a new entry
   *
   * @param {Entry} entry
   * @param {Config} config
   */
  append(entry:Entry, config:Config) {
    const
      entryThreshold = getThresholdValue(entry.level),
      shouldLog =
        // IF OVERRIDE IS SET THEN USE IT
        (isDefined(entry.overrideThreshold) &&
        entryThreshold >= entry.overrideThreshold) ||
        
        // OTHERWISE CHECK NORMALLY
        (entryThreshold >= this.getThreshold(entry.category) &&
          !isDefined(entry.overrideThreshold))
    
    if (shouldLog)
      this.write(entry, config)
  }
  
  /**
   * Close the logger
   *
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {}
  
}