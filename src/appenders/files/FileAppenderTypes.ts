import { AppenderConfig } from "../../Types"
import * as Path from 'path'
import * as Fs from "mz/fs"

export interface FileAppenderConfig extends AppenderConfig {
  /**
   * Get filename for logs - in the case of a regular FileAppender & NOT
   * RollingFileAppender - you should simply ignore the param all together
   *
   * filename(-1) => /tmp/app.log
   *
   * filename(1) => /tmp/app.log.1
   *
   * - or -
   *
   * filename(1) => /tmp/app.1.log
   *
   * @param {number} index - when -1 is the index, the function should return a
   * filename less numerical marking
   *
   * @returns {string} absolute path to log file
   */
  filename: (index: number) => string
  sync: boolean
}

export interface RollingFileAppenderConfig extends FileAppenderConfig {
  maxFiles: number
  maxSize: number
}


export type FileAppenderRequiredProps = "filename"
