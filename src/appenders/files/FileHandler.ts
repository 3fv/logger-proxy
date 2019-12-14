import { existsSync } from "fs"
import { throttle } from "lodash"
import { dirname } from "path"
import { FileAppenderConfig } from "../FileAppenderTypes"
import { FileWriter } from "./FileWriter"

export class FileHandler extends FileWriter {
  
  private readonly throttledFunction:any
  
  private inProcess:boolean = false
  private queue:string[] = []
  //private stream:NodeJS.WriteStream
  
  constructor(private config:FileAppenderConfig) {
    
    super()
    
    const directory = dirname(this.config.filename)
    
    if (!existsSync(directory)) {
      FileWriter.createDirectories(directory)
    }
    
    this.stream = this.createStream(config.filename)
    
    this.throttledFunction = throttle(() => {
      if (!this.inProcess) {
        this.appendFromQueue()
      }
    }, 100)
    
    process.on("beforeExit", () => {
      this.appendFromQueue(true)
    })
    
  }
  
  append(message:string) {
    this.queue.push(message)
    this.throttledFunction()
  }
  
  private appendFromQueue(forceEnd:boolean = false) {
    
    this.inProcess = true
    
    this.appendToFile([
      ...this.queue.splice(0)
    ])
    
    if (forceEnd) {
      this.stream.end(() => {
        this.inProcess = false
      })
    } else {
      this.inProcess = false
    }
    
  }
  
}