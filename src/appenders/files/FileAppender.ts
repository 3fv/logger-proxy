import { AbstractAppender } from "../AbstractAppender"
import { Config, Entry } from "../../Types"
import { defaultsDeep } from "lodash"
import { FileAppenderConfig } from "./FileAppenderTypes"
import { FileHandler } from "./FileHandler"
import * as Path from "path"

const defaultFileAppenderConfig:FileAppenderConfig = {
  filename: (index: number = -1) => {
    const logDir = Path.join(process.cwd(), "logs")
    return Path.join(
      logDir,
      index === -1 ?
        "app.log" : `app.${index}.log`
    )
  },
  sync: false
}

function completeFileAppenderConfig(config: Partial<FileAppenderConfig>): FileAppenderConfig {
  //const {filename} = config
  //ok(isFunction(filename) || (isString(filename) && !isEmpty(filename)), `FileAppenderConfig must have a valid filename`)
  
  return defaultsDeep(config, defaultFileAppenderConfig)
}

export class FileAppender extends AbstractAppender<FileAppenderConfig> {
  
  private readonly handler:FileHandler
  
  constructor(id: string, config: Partial<FileAppenderConfig>) {
    super(id, "file", completeFileAppenderConfig(config))
    
    this.handler = new FileHandler(this.config)
    
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
