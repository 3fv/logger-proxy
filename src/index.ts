
/**
 * Export all functions from ./log
 */


import { configure } from "./Config"

export * from './Config'

/**
 * Export all required types
 */
export * from "./Types"



/**
 * By default export Log manager
 */
// import { getLogger } from "./Logger"
export default configure
