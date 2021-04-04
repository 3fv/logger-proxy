import "jest"
import { LevelKind, LevelNames } from "../types"
import { asOption } from "@3fv/prelude-ts"
import { getLogger } from "../getLogger"

type ConsoleMocks = Array<[prop: string, srcFn:Function, mockFn:Function]>

describe("Logger", () => {
  
  const propsToMock = ["log", ...LevelNames]
  const mockConsole = () => asOption([] as ConsoleMocks)
    .tap(mocks => {
      propsToMock.forEach((prop: LevelKind) => {
        
        const srcFn = global.console[prop]
        const mockFn = global.console[prop] = jest.fn()
        mocks.push([prop,srcFn, mockFn])
        
      })
    })
    .get()
  
  
  test("category is parsed", () => {
    const mocks = mockConsole()
    const levelMocks = mocks.filter(([prop]) => LevelNames.includes(prop as LevelKind)) as Array<[level:LevelKind, srcFn:Function, mockFn:Function]>
    const log = getLogger(__filename)
  
    expect(log.category).toBe("Logger.spec")
  })
  
  
  test("console is default", () => {
    const mocks = mockConsole()
    const levelMocks = mocks.filter(([prop]) => LevelNames.includes(prop as LevelKind)) as Array<[level: LevelKind,srcFn: Function, mockFn: Function]>
    const log = getLogger(__filename)
    
  
    
    levelMocks.forEach(([level, src, mock]) => {
      log[level].bind(log)("test123")
      
      expect(mock).toBeCalledTimes(1)
    })
    
  })
})

