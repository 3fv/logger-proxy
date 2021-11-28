import { Appender } from "../Appender"
import { Level } from "../Level"
import { AsyncLocalStorage } from 'async_hooks';

const contextStorage = new AsyncLocalStorage<Array<LoggerContext>>()

export const currentContextStore = () => contextStorage.getStore()

export class LoggerContext {
  /**
   * Threshold override level
   *
   * @type {Level}
   */
  readonly thresholdLevel: Level

  /**
   * If specified, only categories that match will
   * use this context
   *
   * @type {RegExp}
   */
  readonly pattern: RegExp

  /**
   * Exclusive, only use this config in context.  Defaults to `false`
   *
   * @type {boolean}
   */
  readonly exclusive: RegExp
  
  /**
   * Use a logger context within
   *
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async use<T = unknown>(fn: () => Promise<T>) {
    const contexts = currentContextStore()
    return contextStorage.run<Promise<T>,[]>([...contexts, this], fn)
    
  }
  
  /**
   * Creates a new logger context
   *
   * @param {Appender[]} appenders - additional appenders for the context
   * @param {LoggerContextOptions} options -
   */
  protected constructor(
    readonly appenders: Appender[],
    options: LoggerContextOptions
  ) {
    Object.assign(this, {
      exclusive: false,
      ...options
    })
  }

  /**
   * Create a new logger context
   *
   * @param {Appender[]} appenders
   * @param {LoggerContextOptions} options
   * @returns {LoggerContext}
   */
  static with(appenders: Appender[], options: LoggerContextOptions = {}) {
    return new LoggerContext(appenders, options)
  }
}

export type LoggerContextOptions = Partial<Pick<LoggerContext, "pattern" | "exclusive">>
