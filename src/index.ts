
/**
 * Export all functions from ./log
 */


export * from './Config'

/**
 * Export all required types
 */
export * from "./Types"

/**
 * getLogger
 */
export * from "./Logger"



/**
 * By default export Log manager
 */
import { getLogger } from "./Logger"
export default getLogger
