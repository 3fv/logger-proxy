

/**
 * Log level values
 */
export enum Level {
  trace = "trace",
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
  fatal = "fatal"
}

export type LevelName = keyof typeof Level

export const LevelNames:Array<LevelName> = Object.values(Level)

export type ILogger = {
  [Level in LevelName]: (message: string, ...args:any[]) => void
}

export type LoggingProvider<ExtraArgs extends any[] = []> =  (name: string, ...extraArgs:ExtraArgs) => ILogger

export const DefaultLoggingProvider: LoggingProvider = (name:string) => {
  
  /**
   * Creates a simple logger, parsing
   * provided category as a simple filename
   * and using the current output for output
   *
   * @param name
   * @returns {ILogger}
   */
  
    name = name.split("/").pop().split(".").shift()
    
    
    // Create levels
    return LevelNames.reduce((logger:any, level) => ({
      ...logger,
      [level]: (...args) => {
        let fn = console[level]
        fn = typeof fn === "function" ? fn.bind(console) : console.log.bind(console)
        fn(`[${name}] (${level})`,...args)
      }
    }), { name } as any) as ILogger
    
    
    
  
}

const loggerState = {
  loggingProvider: DefaultLoggingProvider as LoggingProvider<any>
}

export function setLoggingProvider(newLoggingProvider: LoggingProvider) {
  loggerState.loggingProvider = newLoggingProvider
}

export function getLoggingProvider<ExtraArgs extends any[] = []>(): LoggingProvider<ExtraArgs> {
  return loggerState.loggingProvider
}

export function getLogger<ExtraArgs extends any[] = []>(name: string, ...args: ExtraArgs) {
  return (loggerState.loggingProvider as LoggingProvider<ExtraArgs>)(name,...args)
}


