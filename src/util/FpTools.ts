import { isDefined, isFunction } from "@3fv/guard"
import { Option, OptionStatic } from "@3fv/prelude-ts"
import { ShellString, test } from "shelljs"
import { Nullable } from "../Types"

export function IfElse<T, F = T | undefined>(test: boolean | (() => boolean), truthy: T | (() => T), falsey: F| (() => F) = undefined): T | F {
  const isTruthy:any = isFunction(test) ? test() : test
  return isDefined(isTruthy) && isTruthy !== false && isTruthy !== 0 ?
    (isFunction(truthy) ? truthy() : truthy) :
    (isFunction(falsey) ? falsey() : falsey)
}

export const If = IfElse

export function Identity(value) {
  return value
}

export class FileOption extends OptionStatic {
  
  static of(path: string | ShellString): Option<string> {
    path = (!path ? undefined : isFunction(path.toString) ? path.toString() : path) as Nullable<string>
    return Option.of(test("-e", path) ? path : undefined)
  }
  
}