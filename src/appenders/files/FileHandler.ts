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
import * as Bluebird from "bluebird"
import * as Fs from 'fs'

export async function getFileSize(filename: string): Promise<number> {
  return Fs.existsSync(filename) ? Fs.statSync(filename).size : 0
  // stat !(
  //   await FsAsync.exists(filename)
  // ) ?
  //   0 :
  //   (
  //     await FsAsync.stat(filename)
  //   ).size
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
  protected currentFilename: Nullable<string> = null
  
  get isReady() {
    return this.running
  }
  
  protected filename(index: number = -1): string {
    const { filename } = this.config
    return isFunction(filename) ? filename(index) : filename
  }
  
  constructor(config: C) {
    super()
    
    this.config = config
    this.persistHandler = (force: Nullable<boolean> = false) => {
      if (!this.isReady) {
        return
      }
      const update = () => {
        const deferred = this.updatingFilesDeferred = new Deferred<void>()
        this.persist(force)
          .then(() => {
            deferred.resolve()
            this.updatingFilesDeferred = null
          })
          .catch(err => {
            console.error(`Persist failed`, err)
            deferred.resolve()
            this.updatingFilesDeferred = null
          })
          
      }
  
      if (!this.updatingFilesDeferred)
        update()
      
    }
    
    const
      filename = this.currentFilename = this.filename(),
      directory = this.dir = dirname(filename)
    
    if (!existsSync(directory)) {
      mkdirp(directory)
    }
    
    this.throttledFunction = throttle(this.persistHandler, 200)
    
    // process.on("beforeExit", this.close.bind(this))
    //
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
  async close(): Promise<void> {
    const { running, stream } = this
    this.running = false
    this.stream = null
    if (!running || !stream) {
      return Promise.resolve()
    }
    
    if (this.updatingFilesDeferred) {
      await this.updatingFilesDeferred.promise
    }
    
    if (stream) {
      if (this.queue.length) {
        const entries = this.queue.join("\n")
        await Bluebird.fromCallback(fn => stream.write(entries, fn))
          .catch(err => console.warn(`Closing & last write failed`, err))
        
      }
      
      await Bluebird.fromCallback(fn => stream.end(fn))
      
    }
    // await new Promise((resolve, reject) => {
    //   try {
    //     this.stream.end(resolve)
    //   } catch (err) {
    //     console.error("Unable to end", err)
    //     reject(err)
    //   }
    // })
    // await this.persist(true)
    //   .catch(err => console.error(`bad`, err))
  }
  
  /**
   * Append a message
   *
   * @param {string} message
   */
  append(message: string) {
    if (!this.running) {
      return
    }
    
    this.queue.push(message)
    this.throttledFunction()
  }
  
  protected async persist(force: boolean = false) {
    if (!this.running) {
      console.warn("Appender is totally stopped")
      return
    }
    
    
    
    
    // if (!force && this.running) {
    //   return
    // } else {
    //   await deferred.promise
    // }
    //}
    
    // CREATED DEFERRED FOR THIS UPDATE
    //this.updatingFilesDeferred = deferred = new Deferred<void>()
    
    try {
      
      // if (!this.stream) {
      //   await this.prepareFiles()
      // }
      //
      // CHECK IF UPDATES NEEDED
      if (!force) {
        await this.updateFiles()
      }
      
      // GET THE STREAM
      const { stream } = this
      if (!stream) {
        //console.error(`No stream to write to?`)
        
      } else {
        const
          persistSet = [...this.queue],
          { bytes, count } = await this.writeToStream(persistSet, stream)
        
        // Remove all successful entries
        if (count) {
          this.queue.splice(0, count)
          this.currentFileSize += bytes
        }
        
        if (force) {
          await new Promise((resolve, reject) => {
            try {
              stream.end(resolve)
            } catch (err) {
              console.error("Unable to end", err)
              reject(err)
            }
          })
        }
        
      }
      
    } catch (err) {
      console.error(`Unable to update files`, err)
    }
    
    // await deferred.promise
    
  }
  
}