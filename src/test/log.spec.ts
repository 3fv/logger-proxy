import "jest"
import { getLogger, configure, Level, Nullable, Logger } from "../index"
import { ConsoleAppender } from "../appenders/console/ConsoleAppender"
import { FileAppender } from "../appenders/files/FileAppender"
import { Option } from "@3fv/prelude-ts"
import { getConfig } from "../Config"
import * as Path from "path"
import { Deferred } from "../util/Deferred"
import { FileAppenderConfig } from "../appenders/files/FileAppenderTypes"

describe("#logger-console", () => {
  let log: Nullable<Logger> = null
  let consoleAppender = new ConsoleAppender()
  beforeAll(() => {
    configure()
      .appenders([consoleAppender])
      .threshold(Level.trace)
  })
  beforeEach(() => {
    log = getLogger(__filename)
  })
  
  it("#creates", () => {
    
    expect(log).not.toBeNull()
    
    Object.values(Level).forEach(level => {
      log[level].apply(log, [`testing level ${level}`])
    })
    
  })
})

describe("#logger-file", () => {
  let log = null
  
	const opts: Partial<FileAppenderConfig> = {
		filename: (index: number = -1) => Path.join("/tmp", Option.of(index)
			.filter(index => index >= 0)
			.map(index => `spec.${index}.log`)
			.getOrElse("spec.log"))
	}
	
  beforeAll(() => {
    configure()
      .appenders([
        new ConsoleAppender(),
        new FileAppender("tmp-file", opts)
      ])
      .threshold(Level.trace)
  })
  
  beforeEach(() => {
    log = getLogger(__filename)
  })
  
  afterAll(() =>
    Promise.all(getConfig().appenders.map(appender => appender.close()))
  )
  
  it("#check logs are being written", async () => {
    expect(log).not.toBeNull()
    
    Object.values(Level).forEach(level => {
      log[level].apply(log, [`testing level ${level}`])
    })
    
	  log.info("Sleeping for 500 millis before checking")
	  await Deferred.delay(500)
	  
	  
  })
})

// it('#styled',() => {
// 	const stylerSpy = sinon.spy(TypeLogger.getStyler())
// 	TypeLogger.setStyler(stylerSpy)
// 	log.info('testing for spy styling')
//
// 	expect(stylerSpy.calledOnce).to.be.true
// })

// it('#not-styled',() => {
// 	const stylerSpy = sinon.spy(TypeLogger.getStyler())
// 	TypeLogger.setStyler(stylerSpy)
// 	TypeLogger.setStylerEnabled(false)
// 	log.info('testing for spy styling')
//
// 	expect(stylerSpy.calledOnce).to.be.false
// })