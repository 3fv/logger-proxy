import { assign, defaults } from "lodash"
import * as Path from "path"
import * as Fs from "fs"
import { LogRecord } from "./LogRecord"
import { Appender } from "./Appender"
import { asOption, Future } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { Buffer } from "buffer"
import { Deferred } from "@3fv/deferred"
import Debug from "debug"

const FsAsync = Fs.promises

const debug = Debug("3fv:logger:FileAppender")

const getDefaultConfig = (): FileAppenderConfig => ({
  filename: Path.join(process.cwd(), "app.log"),
  prettyPrint: process.env.NODE_ENV !== "production",
  sync: false
})

function applyConfigDefaults(options: FileAppenderOptions): FileAppenderConfig {
  return defaults(options, getDefaultConfig())
}

export interface FileAppenderConfig<Record extends LogRecord = any> {
  filename: string
  prettyPrint: boolean
  sync: boolean
}

export type FileAppenderOptions<Record extends LogRecord = any> = Partial<
  FileAppenderConfig<Record>
>

export class FileAppender<Record extends LogRecord>
  implements Appender<Record> {
  readonly config: FileAppenderConfig<Record>

  private readonly state: {
    filename: string
    file: Fs.promises.FileHandle
    flushing: boolean
    queue: Array<Buffer>
    ready: boolean
    error?: Error
    readyDeferred: Deferred<FileAppender<Record>>
  } = {
    filename: undefined,
    file: undefined,
    ready: false,
    flushing: false,
    queue: [],
    readyDeferred: undefined
  }


  isReady() {
    return this.state.ready
  }

  whenReady() {
    return this.setup()
  }

  /**
   * Initialize and setup the appender
   *
   * @returns {Promise<FileAppender<Record>>}
   */
  async setup(): Promise<FileAppender<Record>> {
    const { state } = this
    if (!!state.readyDeferred) {
      return state.readyDeferred.promise
    }
  
    const deferred = this.state.readyDeferred = new Deferred<FileAppender<Record>>()
    try {
    
      const { filename } = this
      const file = await FsAsync.open(filename, "a")
    
      assign(state, {
        filename,
        file,
        ready: true
      })
    
      deferred.resolve(this)
      return deferred.promise
    } catch (err) {
      deferred.reject(err)
      assign(state, {
        error: err,
        file: undefined,
        ready: false,
        readyDeferred: undefined
      })
      return deferred.promise
    }
  }
  
  /**
   * Close the handler
   *
   * @returns {Promise<void>}
   */
  close(): Promise<void> {
    return asOption(this.state.file)
      .map((file) => file.close())
      .getOrCall(() => Promise.resolve())
      .catch((err) => {
        console.warn(`failed to cleanly close file`, err)
        return Promise.resolve()
      })
  }
  
  get queue() {
    return this.state.queue
  }
  
  get file() {
    return this.state.file
  }
  
  get flushing() {
    return this.state.flushing
  }
  
  get filename() {
    return (this.state.filename = this.state.filename ?? this.config.filename)
  }
  
  /**
   * Appends the log queue records to the file
   */
  private flush() {
    
    Future.do(async () => {
      await this.whenReady()
      this.state.flushing = true
      try {
        const { file } = this
        if (!file) {
          throw Error(`${this.filename} was not opened properly`)
        }
        while (this.queue.length) {
          const buf:Buffer = this.queue.shift()
          await this.file.appendFile(buf, "utf-8")
        }
    
        await this.file.datasync()
      } catch (err) {
        console.error(`Failed to append file ${this.filename}`, err)
      } finally {
        this.state.flushing = false
        if (this.queue.length) {
          queueMicrotask(() => this.flush())
        }
      }
  
    })
  }

  /**
   * Handle log records, transform, push to ES
   *
   * @param record
   */
  append(record: Record): void {
    try {
      const { queue, filename } = this.state
      const count = queue.length
      if (count > 999) {
        debug(
          `Too many log records (${count}) are in the queue without the file (${filename}) opening, skipping %O`,
          record
        )
        return
      }

      const data = this.config.prettyPrint
        ? JSON.stringify(record, null, 2)
        : JSON.stringify(record)
      queue.push(Buffer.from(data + "\n", "utf-8"))
      this.flush()
    } catch (err) {
      console.warn(`Failed to synchronize `,err)
    }
  }

  /**
   *
   * @param {Partial<FileAppenderOptions<Record>>} options
   */
  constructor(options: Partial<FileAppenderOptions<Record>> = {}) {
    this.config = applyConfigDefaults(options)
    
    assign(this.state,{
      filename: this.config.filename
    })
    
    queueMicrotask(() => {
      this.setup()
        .then(({ state }) => {
          debug(`File appender is ready, logging to ${state.filename}`)
          return this
        })
        .catch((err) => {
          console.error(`failed to setup file appender`, err)
        })
    })
  }
}
