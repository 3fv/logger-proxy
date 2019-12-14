import "jest"
import { getLogger, configure, Level } from "../index"
import { ConsoleAppender } from "../appenders/ConsoleAppender"

describe('#logger',() => {
	let log = null
	
	beforeAll(() => {
		configure()
			.appenders([new ConsoleAppender()])
			.threshold(Level.trace)
	})
	beforeEach(() => {
		log = getLogger(__filename)
	})

	it('#creates',() => {

		expect(log).not.toBeNull()
		
		Object.values(Level).forEach(level => {
			log[level].apply(log,[`testing level ${level}`])
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
})