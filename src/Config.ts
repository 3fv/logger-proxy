import { Config, LogFactory, Level, Logger, Category } from "./Types"
import { defaultsDeep, cloneDeep } from "lodash"
import { DefaultFormatter } from "./formatters/DefaultFormatter"
import { DefaultStackDataProvider } from "./stack-data/DefaultStackDataProvider"
import { pathToBasename } from "./util/CoreUtil"
import { makeLogger } from "./Logger"

/**
 * Config defaults
 *
 * @type {Config}
 */
const defaultConfig: Config = {
  appenders: [],
  formatter: DefaultFormatter,
  rootLevel: Level.debug,
  stack: {
    enabled: true,
    removeFrames: 3,
    provider: DefaultStackDataProvider,
    root: ""
  }
}

/**
 * Configurator creates log factories
 */
export type Configurator = {
  [Key in keyof Config]: (value: Config[Key]) => Configurator
} & {
  getFactory: () => LogFactory
}

/**
 * Very simple chained configurator
 *
 * @returns {Configurator}
 */
export function configure(): Configurator {
  let ref: any = null
  const
    config = cloneDeep(defaultConfig),
    loggerMap = new Map<string, Logger>(),
    categoryMap = new Map<string, Category>(),
    factory: LogFactory = {
    
    getConfig: (): Config =>  config,
      getRootLevel: (): Level =>
        config.rootLevel
      ,
      setConfig: (patch: Partial<Config>): Config => {
        return Object.assign(config, defaultsDeep({ ...patch }, config))
      },
      getAppenderIds: (): string[] => {
        return config.appenders.map(it => it.id)
      },
      getCategory: (name: string) => {
        if (!categoryMap.has(name)) {
          categoryMap.set(name,new Category(name))
        }
  
        return categoryMap.get(name)
      },
      getLogger: (path: string, categoryName: string = pathToBasename(path)): Logger => {
        let logger = loggerMap.get(path)
        if (!logger) {
          loggerMap.set(path, logger = makeLogger(factory, path, categoryName))
        }
    
        return logger
      }
    }
  ref = new Proxy({
    getFactory: (): LogFactory => {
      config.appenders.forEach(it => it.setFactory(factory))
      return factory
    }
  }, {
    get: (target: any, p: string, receiver: any) => {
      
      return target[p] || ((newValue) => {
        config[p] = newValue
        return ref
      })
    }
  }) as Configurator
  
  return ref
}