import { AbstractAppender } from "../AbstractAppender"
import { Config, Entry } from "../../Types"
import { RollingFileAppenderConfig } from "./FileAppenderTypes"
import { RollingFileHandler } from "./RollingFileHandler"
import * as Path from "path"
import { ok } from "assert"
import { defaultsDeep, isEmpty } from "lodash"
import { isFunction, isString } from "@3fv/guard"

const defaultRollingFileAppenderConfig: RollingFileAppenderConfig = {
  filename: (index: number = -1) => {
    const logDir = Path.join(process.cwd(), "logs")
    return Path.join(
      logDir,
      index === -1 ?
        "app.log" : `app.${index}.log`
    )
  },
  maxFiles: 5,
  maxSize: 10,
  sync: false
}

function completeRollingFileAppenderConfig(config: Partial<RollingFileAppenderConfig>): RollingFileAppenderConfig {
  // const {filename} = config
  // ok(isFunction(filename) || (isString(filename) && !isEmpty(filename)), `FileAppenderConfig must have a valid filename string or function`)
  //
  return defaultsDeep(config, defaultRollingFileAppenderConfig)
}


export class RollingFileAppender extends AbstractAppender<RollingFileAppenderConfig> {
  
  private handler: RollingFileHandler;
  constructor(id: string, config: Pick<RollingFileAppenderConfig, "filename"> & Partial<RollingFileAppenderConfig>) {
    super(id, "rolling-file", completeRollingFileAppenderConfig(config))
    
    this.handler = new RollingFileHandler(this.config)
    
  }
  
  async close(): Promise<void> {
    await this.handler.close()
  }
  
  /**
   * Appends the log event
   * @param entry
   * @param config
   */
  write(entry:Entry, config: Config) {
    const forward = () =>
      this.handler.append(this.format(entry, config)[0])
    
    if (this.config.sync) {
      forward()
    } else {
      process.nextTick(forward)
    }
    
  }
  
  
}