import { getThresholdValue, pathToBasename } from "./util/CoreUtil"
import { Category, Config, Entry, Level, LogFactory, Logger } from "./Types"
import { Option } from "@3fv/prelude-ts"
import { isFunction } from "@3fv/guard"

function log(config: Config, logger: Logger,category: Category, level: Level, message: string, args:any[]) {
  const
    {stack: stackConfig} = config,
    {config: categoryConfig} = category,
    {appenderIds} = categoryConfig,
    appenders = config.appenders.filter(it => !appenderIds || appenderIds.includes(it.id))
  
  if (appenders.length) {
    const entry:Entry = {
      timestamp: Date.now(),
      level,
      threshold: getThresholdValue(level),
      category,
      logger,
      message,
      args,
      stackData: Option.of(stackConfig)
        .filter(({enabled, provider}) => !!enabled && isFunction(provider))
        .map(({provider}) => provider(entry, config))
        .getOrNull()
    }
    appenders.forEach(appender => {
      appender.append(entry, config)
    })
  }
}



export function makeLogger(factory: LogFactory, path: string, categoryName: string): Logger {
  return Option.of(factory.getCategory(categoryName))
    .map(category =>
      Object.values(Level).reduce((logger, level) => {
        logger[level] = (message: string, ...args:any[]) => {
          log(factory.getConfig(),logger,category, level, message, args)
        }
        return logger
      },{
        category,
        basename: pathToBasename(path),
        path
      } as Logger)
    )
    .getOrThrow()
}


