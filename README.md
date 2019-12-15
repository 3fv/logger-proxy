# @3fv/logger
---


## Overview

`@3fv/logger` born from `typelogger` inspired by `slf4j`,
`log4j2` & `logback`, etc.


## Install
Pretty simple

```bash
yarn i --save @3fv/logger
```

## Use
It couldn't be much easier

```typescript
import {getLogger, configure, Level} from "@3fv/logger"
import { ConsoleAppender } from "@3fv/logger/appenders/console/ConsoleAppender"
import { FileAppender } from "@3fv/logger/appenders/files/FileAppender" 
import { RollingFileAppender } from "@3fv/logger/appenders/files/RollingFileAppender"
import * as Path from "path"

// Chained configure() function supports every option
configure()
      .appenders([
        new ConsoleAppender(),
        new FileAppender("file", {
            filename: (index: number = -1) => Path.join("/tmp", index > -1 ? 
                `spec.file.appender.${index}.log` : 
                "spec.file.appender.log")
        }),
        new RollingFileAppender("rolling-file", {
            filename: (index: number = -1) => Path.join("/tmp", index > -1 ? 
                `spec.rolling.file.appender.${index}.log` : 
                "spec.rolling.file.appender.log"),
            maxFiles: 3,
            maxSize: 1
        })
      ])
      .threshold(Level.trace)


const log = getLogger(__filename)
log.info('What up!!!')


```