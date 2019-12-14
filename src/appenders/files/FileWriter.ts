import { createWriteStream, mkdirSync, WriteStream } from "fs"
import { isAbsolute, resolve, sep } from "path"
import * as _ from "lodash"

export abstract class FileWriter {
  
  public static createDirectories(dir:string) {
    
    const
      separator = sep,
      initDirectory = isAbsolute(dir) ? separator : "",
      baseDirectory = "."
    
    return dir.split(separator).reduce((parentDir, childDir) => {
      
      const currentDirectory = resolve(baseDirectory, parentDir, childDir)
      try {
        mkdirSync(currentDirectory)
      } catch (err) {
        const doRethrow = _(["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1)
          .thru(caughtErr => !caughtErr || caughtErr && currentDirectory === resolve(dir))
          .value()
          
        if (err.code === "EEXIST") {
          return currentDirectory
        } else if (err.code === "ENOENT") {
          throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`)
        } else if (doRethrow) {
          throw err
        }
      }
      
      return currentDirectory
    }, initDirectory)
  }
  
  
  protected stream:WriteStream
  
  
  protected appendToFile(messages:string[]):number {
    
    let size = 0
    
    this.stream.cork()
    
    messages.forEach((message: string) => {
      size += Buffer.byteLength(message)
      this.stream.write(message + "\n")
    })
    
    process.nextTick(() => this.stream.uncork())
    
    return size
    
  }
  
  protected createStream(fileName:string):WriteStream {
    return createWriteStream(fileName, {
      autoClose: true,
      encoding: "utf8",
      flags: "w+"
    })
  }
  
}