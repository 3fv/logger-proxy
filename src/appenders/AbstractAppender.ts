import {
  Appender,
  Category,
  Config,
  Formatter,
  Level,
  Entry,
  Nullable, AppenderConfig, LogFactory
} from "../Types"
import { identity } from "lodash"
import {Option} from "@3fv/prelude-ts"
import {isDefined, isFunction, getValue} from "@3fv/guard"
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
  
  get threshold(): Nullable<Level> {
    return this.state.config.threshold
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
  
  getThreshold(category: Category): number {
    return getThresholdValue(category.threshold || this.threshold || this.factory.getConfig().threshold)
    
  }
  
  
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
  
  append(entry:Entry, config:Config) {
    const
      threshold = this.getThreshold(entry.category),
      shouldLog = entry.threshold >= threshold
        if (shouldLog)
          this.write(entry, config)
  }
  
  async close(): Promise<void> {}
  
}