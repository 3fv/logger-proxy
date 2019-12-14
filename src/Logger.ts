import { warnLog, getProp, parseLogLevel, formatValue, getThresholdValue, pathToBasename } from "./Util"
import { Formatter, Level, Logger, LevelNames, Config, Category, Entry, Nullable, StackData } from "./Types"
import { getConfig, setConfig } from "./Config"
import {Option} from "@3fv/prelude-ts"
import { cloneDeep } from "lodash"
import { isFunction } from "@3fv/guard"
const loggerMap = new Map<string, Logger>()

function log(logger: Logger,category: Category, level: Level, message: string, args:any[]) {
  const
    config = getConfig(),
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



function makeLogger(path: string, categoryName: string): Logger {
  return Option.of(Category.get(categoryName))
    .map(category =>
      Object.values(Level).reduce((logger, level) => {
        logger[level] = (message: string, ...args:any[]) => {
          log(logger,category, level, message, args)
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

export function getLogger(path: string, categoryName: string = pathToBasename(path)): Logger {
  let logger = loggerMap.get(path)
  if (!logger)
    loggerMap.set(path,logger = makeLogger(path, categoryName))
  
  return logger
}
