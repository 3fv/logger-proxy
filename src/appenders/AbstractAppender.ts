import {
  Appender,
  Category,
  Config,
  Formatter,
  LogLevel,
  Entry,
  Nullable
} from "../Types"
import { identity } from "lodash"
import { getConfig } from "../Config"
import {Option} from "@3fv/prelude-ts"
import {isDefined, isFunction} from "@3fv/guard"
import { getThresholdValue } from "../Util"
import { ok } from "assert"
import { DefaultFormatter } from "../formatters/DefaultFormatter"

export abstract class AbstractAppender<AppenderConfig = any> implements Appender<AppenderConfig> {
  
  private state:{
    config:  Nullable<AppenderConfig>
    formatter: Nullable<Formatter>
  } = {
    config: null,
    formatter: null
  }
  
  get config() {
    return this.state.config
  }
  
  get formatter(): Formatter {
    return Option.ofNullable(this.state.formatter)
      .orElse(() =>
        Option.ofNullable(getConfig().formatter)
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
      config,
      formatter
    })
  }
  
  protected overrideThreshold: Nullable<LogLevel> = null
  
  format(entry:Entry, config:Config = getConfig()): [string, Array<any>] {
    const {formatter} = this
    ok(isDefined(formatter) && isFunction(formatter.format), `No valid formatter available`)
    return formatter.format(entry,config)
  }
  
  getThreshold(category: Category): number {
    return Option.ofTruthy(category.threshold || this.overrideThreshold)
      .map(it => getThresholdValue(it))
      .getOrCall(() => getThresholdValue(getConfig().threshold))
  }
  
  
  getFormatter():Formatter {
    return Option.ofNullable(this.state.formatter)
      .match({
        Some: identity,
        None: () => getConfig().formatter
      })
  }
  
  setFormatter(value:Nullable<Formatter>) {
    this.state.formatter = value
  }
  
  abstract write(entry: Entry, config: Config):void
  
  append(entry:Entry, config:Config) {
    Option.ofTruthy(entry.threshold >= this.getThreshold(entry.category))
      .ifSome(() => this.write(entry, config))
  }
  
  
}