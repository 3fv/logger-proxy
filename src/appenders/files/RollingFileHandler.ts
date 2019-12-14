import { RollingFileAppenderConfig } from "./FileAppenderTypes"
import { FileHandler } from "./FileHandler"
import * as FsAsync from "mz/fs"
import { range } from "lodash"
import { guard } from "@3fv/guard"
import { WriteStream } from "fs"
import { once } from "events"

export class RollingFileHandler extends FileHandler<RollingFileAppenderConfig> {
  
  
  private get maxFiles(): number {
    return this.config.maxFiles
  }
  
  
  private get maxFileSize(): number {
    return this.config.maxSize * 1024 * 1000
  }
  
  constructor(config: RollingFileAppenderConfig) {
    super(config)

  }
  
  private async houseKeeping() {
    const filenames = range(this.maxFiles,100 - this.maxFiles)
      .map(index => this.filename(index))
    
    for await (const filename of filenames) {
      if (await FsAsync.exists(filename)) {
        console.warn(`${filename} should not exist, removing`)
        await guard(() => FsAsync.unlink(filename), err => console.error(`Unable to remove ${filename}`, err))
        continue
      }
      break
    }
  }
  
  /**
   * Before stream is opened this method is called
   * @param {string} filename
   * @param {number} size
   * @returns {Promise<void>}
   */
  protected async beforeOpen(filename: string, size: number): Promise<void> {
    if (size >= this.maxFileSize) {
      await this.shiftFiles()
      
    }
  }
  
  /**
   * Cleanly moves files down the history scheme
   * removing what is currently the final file IF
   * the number of history logs >= max
   * @returns {Promise<void>}
   */
  private async shiftFiles() {
    const {stream} = this
    try {
      this.stream = null
      if (!!stream) {
        try {
          const closePromise = once(stream, "close")
          stream.close()
          await closePromise
        } catch (err) {
          console.error(`Unable to cleanly close stream`, err)
          throw err
        }
      }
      const
        filenames = range(0, this.maxFiles)
          .map(index =>
            [
              index === 0 ? this.currentFilename : this.filename(index - 1),
              this.filename(index)
            ]
          )
  
      for await (const [from, to] of filenames.reverse()) {
        if (await FsAsync.exists(to)) {
          await FsAsync.unlink(to)
        }
    
        await FsAsync.rename(from, to)
      }
    } catch (err) {
      console.error(`Unable to cleanly shift files`, err)
    }
    this.currentFilename = this.filename()
    this.currentFileSize = 0
    this.stream = super.createStream(this.currentFilename)
  }
  
  /**
   * Constructor callback before ready
   *
   * @returns {Promise<void>}
   */
  protected async prepareFiles() {
    await this.houseKeeping()
    await super.prepareFiles()
  }
  
  /**
   * Checks to see if log rotation is needed
   *
   * @returns {Promise<void>}
   */
  protected async updateFiles(): Promise<void> {
    if (this.currentFileSize >= this.maxFileSize) {
      await this.shiftFiles()
    }
  }
  
  /**
   * Creates append write stream
   * @param {string} filename
   * @returns {WriteStream}
   */
  protected createStream(filename:string):WriteStream {
    return super.createStream(filename,"a+")
  }
  
  
}