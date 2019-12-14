import { Config, Level } from "./Types"
import { defaultsDeep } from "lodash"
import { DefaultFormatter } from "./formatters/DefaultFormatter"
import { DefaultStackDataProvider } from "./stack-data/DefaultStackDataProvider"


const config: Config = {
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

export function getConfig(): Config {
  return config
}

export function setConfig(patch: Partial<Config>):Config {
  return Object.assign(config, defaultsDeep({...patch}, config))
}

export function getAppenderIds(): string[] {
  return getConfig().appenders.map(it => it.id)
}

export type Configurator = {
  [Key in keyof Config]: (value: Config[Key]) => Configurator
}



/**
 * Very simple chained configurator
 *
 * @returns {Configurator}
 */
export function configure(): Configurator {
  let ref: any = null
  ref = new Proxy({}, {
    get: (target: any, p: string, receiver: any) => {
      return (newValue) => {
        config[p] = newValue
        return ref
      }
    }
  }) as Configurator
  
  return ref
}