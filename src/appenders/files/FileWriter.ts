import { createWriteStream, WriteStream } from "fs"
import { once } from "events"
import { Deferred } from "../../util/Deferred"

export abstract class FileWriter {
  
  
  
  protected stream:WriteStream
  
  
  protected async writeToStream(messages:string[]):Promise<{bytes:number, count: number}> {
    
    let result = {bytes: 0, count: 0}
    
    this.stream.cork()
    
    for await (const message of messages) {
      if (!this.stream.write(message + "\n")) {
        await once(this.stream, "drain")
        break
      }
      
      result.bytes += Buffer.byteLength(message)
      result.count++
    }
    
    await Deferred.delay(1)
    this.stream.uncork()
    
    return result
    
  }
  
  protected createStream(filename:string, flags: string = "w+"):WriteStream {
    return createWriteStream(filename, {
      autoClose: true,
      encoding: "utf8",
      flags
    })
  }
  
}