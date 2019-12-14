
export interface IFileAppenderConfig {
  fileName:string;
}

export interface FileAppenderConfig {
  filename:string
  sync: boolean
}


export type FileAppenderRequiredProps = "filename"
