import { AbstractAppender } from "./AbstractAppender"
import { AppenderConfig, Config, Entry, Nullable } from "../Types"
import { formatValue } from "../Util"


export interface ConsoleAppenderConfig extends AppenderConfig {

}

export class ConsoleAppender extends AbstractAppender<ConsoleAppenderConfig> {
  
  constructor(config?: Nullable<ConsoleAppenderConfig>) {
    super("console", "console", config || {})
  }
  
  write(entry: Entry, config: Config): void {
    const
      {level} = entry,
      //method = console[level] || console.info,
      [text, args] = this.format(entry, config)
  
    process.stdout.write([text,...args.map(formatValue)].join(" ") + "\n")
     //method.apply(console, [text,...args])
  }
  
}