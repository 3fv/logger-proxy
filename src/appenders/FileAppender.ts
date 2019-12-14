import { AbstractAppender } from "./AbstractAppender"
import { Config, Entry } from "../Types"
import { defaults, defaultsDeep, isEmpty } from "lodash"
import { ok } from "assert"
import { FileAppenderConfig, FileAppenderRequiredProps } from "./FileAppenderTypes"
import { FileHandler } from "./files/FileHandler"


const defaultFileAppenderConfig:Omit<FileAppenderConfig, FileAppenderRequiredProps> = {
  sync: false
}

function completeFileAppenderConfig(config: Partial<FileAppenderConfig>): FileAppenderConfig {
  ok(!isEmpty(config.filename), `FileAppenderConfig must have a valid filename`)
  
  return defaultsDeep(config, defaultFileAppenderConfig)
}

export class FileAppender extends AbstractAppender<FileAppenderConfig> {
  
  private readonly handler:FileHandler
  
  constructor(id: string, config: Pick<FileAppenderConfig, "filename"> & Partial<FileAppenderConfig>) {
    super(id, "file", completeFileAppenderConfig(config))
    
    this.handler = new FileHandler(this.config)
    
  }
  
  /**
   * Appends the log event
   * @param {ILogEvent} logEvent
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