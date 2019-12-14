import { existsSync } from "fs"
import { throttle } from "lodash"
import { dirname } from "path"
import { FileAppenderConfig } from "./FileAppenderTypes"
import { FileWriter } from "./FileWriter"
import { isFunction } from "@3fv/guard"
import { Nullable } from "../../Types"
import { Deferred } from "../../util/Deferred"
import { Option } from "@3fv/prelude-ts"
import { mkdirp } from "../../util/ShellUtil"
import * as FsAsync from "mz/fs"

export async function getFileSize(filename: string): Promise<number> {
  return !(await FsAsync.exists(filename)) ?
    0:
    (await FsAsync.stat(filename)).size
}

export class FileHandler<C extends FileAppenderConfig = FileAppenderConfig> extends FileWriter {
  
  protected readonly throttledFunction: any
  
  protected queue: string[] = []
  protected running = true
  protected readonly config: C
  protected updatingFilesDeferred: Nullable<Deferred<void>>
  protected readonly persistHandler: (force?: Nullable<boolean>) => void
  protected readonly dir: string
  
  protected currentFileSize = 0
  protected currentFilename:Nullable<string> = null
  
  get isReady() {
    return this.running && !!this.stream
  }
  
  protected filename(index: number = -1): string {
    const { filename } = this.config
    return isFunction(filename) ? filename(index) : filename
  }
  
  constructor(config: C) {
    super()
    
    this.config = config
    this.persistHandler = (force: Nullable<boolean> = false) => {
      if (!this.isReady) return
      const update = () => this.persist(force)
      Option.of(this.updatingFilesDeferred)
        .match({
          Some: it => it.promise.then(update),
          None: () => update()
        })
      
    }
    
    const
      filename = this.currentFilename = this.filename(),
      directory = this.dir = dirname(filename)
    
    if (!existsSync(directory)) {
      mkdirp(directory)
    }
    
    
    
    this.throttledFunction = throttle(this.persistHandler, 100)
    
    process.on("beforeExit", this.close.bind(this))
  
    this.prepareFiles()
      .catch(err => {
        console.error("Prepare failed", err)
      })
    
  }
  
  protected async beforeOpen(filename: string, size: number): Promise<void> {
  
  }
  
  protected async prepareFiles(): Promise<void> {
    if (!this.stream) {
      const
        filename = this.currentFilename = this.filename(),
        size = this.currentFileSize = await getFileSize(filename)
      
      await this.beforeOpen(filename, size)
      
      this.stream = this.createStream(filename)
    } else {
      console.warn("Prepare files call on regular file appender more than once")
    }
  }
  
  /**
   * Called before writing
   * @returns {Promise<void>}
   */
  protected async updateFiles(): Promise<void> {
    // default does nothing
  }
  
  /**
   * Close the handler
   *
   * @returns {Promise<void>}
   */
  close(): Promise<void> {
    if (!this.running) {
      return Promise.resolve()
    }
    
    this.running = false
    return this.persist(true)
      .catch(err => console.error(`bad`, err))
  }
  
  /**
   * Append a message
   *
   * @param {string} message
   */
  append(message: string) {
    if(!this.running)
      return
    
    this.queue.push(message)
    this.throttledFunction()
  }
  
  protected async persist(force: boolean = false) {
    if (!this.running && !this.stream) {
      console.warn("Appender is totally stopped")
      return
    }
  
    if (!this.stream) {
      console.warn("Out stream is not open, likely rotating or preparing")
      return
    }
    
    let { updatingFilesDeferred: deferred } = this
    
    if (deferred) {
      if (!force && this.running) {
        return
      } else {
        await deferred.promise
      }
    }
    
    // CREATED DEFERRED FOR THIS UPDATE
    this.updatingFilesDeferred = deferred = new Deferred<void>()
    
    
    try {
      
      // CHECK IF UPDATES NEEDED
      if (!force)
        await this.updateFiles()
      
      // GET THE STREAM
      const {stream} = this
      if (!stream) {
        console.error(`No stream to write to?`)
        deferred.resolve()
        return
      }
      const
        persistSet = [...this.queue],
        {bytes, count} = await this.writeToStream(persistSet)
        
      
      // Remove all successful entries
      if (count) {
        this.queue.splice(0, count)
        this.currentFileSize += bytes
      }
      
      if (force) {
        await new Promise((resolve, reject) => {
          try {
            this.stream.end(resolve)
          } catch (err) {
            console.error("Unable to end", err)
            reject(err)
          }
        })
      } else {
        deferred.resolve()
      }
    } catch (err) {
      console.error(`Unable to update files`, err)
      deferred.reject(err)
    } finally {
      this.updatingFilesDeferred = null
    }
    
    await deferred.promise
    
  }
  
}