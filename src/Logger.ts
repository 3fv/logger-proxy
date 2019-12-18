import { getThresholdValue, pathToBasename } from "./util/CoreUtil"
import { Category, Config, Entry, Level, LogFactory, Logger, Nullable } from "./Types"
import { Option } from "@3fv/prelude-ts"
import { isNumber, isFunction, isDefined } from "@3fv/guard"

function log(
  factory: LogFactory,
  logger: Logger,
  category: Category,
  level: Nullable<Level>,
  message: string,
  args: any[]
) {
  const
    config = factory.getConfig(),
    { stack: stackConfig } = config,
    { config: categoryConfig } = category,
    { appenderIds } = categoryConfig,
    appenders = config.appenders.filter(it => !appenderIds || appenderIds.includes(it.id))
  
  if (!!appenders.length) {
    const entry: Entry = {
      timestamp: Date.now(),
      level,
      overrideThreshold: logger.overrideThreshold,
      category,
      logger,
      message,
      args,
      stackData: Option.of(stackConfig)
        .filter(({ enabled, provider }) => !!enabled && isFunction(provider))
        .map(({ provider }) => provider(entry, config))
        .getOrNull()
    }
    appenders.forEach(appender => {
      appender.append(entry, config)
    })
  }
}

export function makeLogger(factory: LogFactory, path: string, categoryName: string): Logger {
  
  const [traceThreshold, debugThreshold, infoThreshold] = [Level.trace, Level.debug, Level.info]
    .map(getThresholdValue)
  
  return Option.of(factory.getCategory(categoryName))
    .map(category => {
      let overrideThreshold: Nullable<number> = undefined
      const logger = {} as Logger
      Object.defineProperties(
        Object.assign(logger, {
          category,
          basename: pathToBasename(path),
          path,
          setOverrideThreshold: (level: Level | number) => {
            overrideThreshold = isNumber(level) ? level : getThresholdValue(level)
            return logger
          },
          isTraceEnabled: () =>
            [overrideThreshold, getThresholdValue(factory.getConfig().rootLevel)]
              .filter(isDefined)
              .some(level => level >= traceThreshold),
          isDebugEnabled: () =>
            [overrideThreshold, getThresholdValue(factory.getConfig().rootLevel)]
              .filter(isDefined)
              .some(level => level >= debugThreshold),
          isInfoEnabled: () =>
            [overrideThreshold, getThresholdValue(factory.getConfig().rootLevel)]
              .filter(isDefined)
              .some(level => level >= infoThreshold)
          
        }) as Logger,
        {
          overrideThreshold: {
            configurable: false,
            get(): any {
              return overrideThreshold
            }
          }
        }
      )
      return Object.values(Level).reduce((logger, level) => {
        logger[level] = (message: string, ...args: any[]) => {
          log(factory, logger, category, level, message, args)
        }
        return logger
      }, logger)
    })
    .getOrThrow()
}


