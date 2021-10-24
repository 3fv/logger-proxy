import { LevelKind, LevelNames } from "./Level"


export const isString = (s: any): s is string => typeof s === "string"

export function isLogLevelKind(o:any):o is LevelKind {
  return LevelNames.includes(o?.toLowerCase?.())
}
