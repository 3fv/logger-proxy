import { Config, Entry, Nullable, StackData } from "../Types"
import * as Path from "path"

const
  stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i,
  stackReg2 = /at\s+()(.*):(\d*):(\d*)/i

export function DefaultStackDataProvider(entry: Partial<Entry>, config: Config): Nullable<StackData> {
  const
    { stack } = config,
    { removeFrames, root, enabled } = stack
  
  if (!enabled)
    return null
  
  
  const
    err = new Error(),
    frames = err.stack.split("\n").slice(3),
    
    frame = frames[removeFrames] || frames[0],
    frameParts = stackReg.exec(frame) || stackReg2.exec(frame),
    path = frameParts[2]
  
  return frameParts && frameParts.length === 5 ? {
    method: frameParts[1],
    path,
    line: frameParts[3],
    pos: frameParts[4],
    folder: Path.dirname(root && Path.isAbsolute(root)
      ? path.replace(new RegExp("^" + root + Path.sep + "?"), "")
      : Path.resolve(path)),
    file: Path.basename(path),
    
    stack: frames
  } : null
  
  
}