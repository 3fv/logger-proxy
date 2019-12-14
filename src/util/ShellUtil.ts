import { ok } from "assert"
import { exec,mkdir, test,ExecOptions, ShellReturnValue } from "shelljs"
import { getValue } from "@3fv/guard"
import { Option } from "@3fv/prelude-ts"
import { defaults, isEmpty } from "lodash"
import { If } from "./FpTools"
import { ProcessEnvOptions } from "child_process"
import { Nullable } from "../Types"


export function mkdirp(path: string): string {
  const {code, stderr} = mkdir("-p", path)
  If(code !== 0, () => {
    throw new Error(isEmpty(stderr) ? `Unable to create directory ${path}` : stderr)
  })
  
  return path
}


/**
 *
 * @type {{asOption: boolean}}
 */
const ExecDefaults = Object.freeze({
  asOption: false
})

export type ExecuteCommandOptions<AsOptions extends boolean = boolean> =
  ProcessEnvOptions & ExecOptions & { asOption?: AsOptions, errorMessage?: Nullable<string>}

/**
 *
 * Execute command
 *
 * @param script
 * @param ignoreErrors if ignore is false, an error is raised on a non-zero return code
 * @param opts {ExecuteCommandOptions}
 * @returns ShellReturnValue | Option<ShellReturnValue>
 */
export function executeCommand(script, ignoreErrors: boolean, opts: ExecuteCommandOptions & { asOption: true }): Option<ShellReturnValue>
export function executeCommand(script, ignoreErrors?: boolean, opts?: Nullable<ExecuteCommandOptions>): ShellReturnValue
export function executeCommand(script, ignoreErrors: boolean = false, opts: ExecuteCommandOptions = {}): ShellReturnValue | Option<ShellReturnValue> {
  const
    execOpts = defaults(opts, ExecDefaults) as ExecOptions,
    result = Option.of(exec(script, execOpts) as ShellReturnValue)
      .ifSome(result => {
        If(
          result.code !== 0 && ignoreErrors !== true,
          () => {
            process.exit(result.code)
          })
      })
  
  return getValue(() => opts.asOption === true) ? result : result.getOrThrow()
}

/**
 *
 * @param script
 * @param ignoreErrors
 * @param opts
 * @returns Option<ShellReturnValue>
 */
export function optionExecuteCommand(script, ignoreErrors = false, opts = {}) {
  return executeCommand(
    script,
    ignoreErrors,
    {
      ...(opts || {}),
      asOption: true
    })
}

/**
 * Shell enum - if we go to
 * Typescript this will be a real enum
 *
 * @type {{fish: string, bash: string}}
 */
export enum Shell {
  fish = "fish",
  bash = "bash"
}
