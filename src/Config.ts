import { Config, LogFactory, Level, Logger, Category } from "./Types"
import { defaultsDeep, cloneDeep } from "lodash"
import { DefaultFormatter } from "./formatters/DefaultFormatter"
import { DefaultStackDataProvider } from "./stack-data/DefaultStackDataProvider"
import { pathToBasename } from "./util/CoreUtil"
import { makeLogger } from "./Logger"

const defaultConfig: Config = {
  appenders: [],
  formatter: DefaultFormatter,
  threshold: Level.debug,
  stack: {
    enabled: true,
    removeFrames: 3,
    provider: DefaultStackDataProvider,
    root: ""
  }
}

// export function getConfig(): Config {
//   return config
// }
//
// export function setConfig(patch: Partial<Config>):Config {
//   return Object.assign(config, defaultsDeep({...patch}, config))
// }

// export function getAppenderIds(): string[] {
//   return getConfig().appenders.map(it => it.id)
// }

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