import { AppenderConfig } from "../Types"


export interface FileAppenderConfig extends AppenderConfig {
  filename:string
  sync: boolean
}


export type FileAppenderRequiredProps = "filename"
