import { isDefined, isPromise } from "@3fv/guard"
import * as BBPromise from 'bluebird'
import assert from "assert"

interface DeferredState<T> {
  resolve: (result?:T) => void
  reject: (err:any) => void
  isSettled: boolean
  isCancelled: boolean
  isRejected: boolean
  isFulfilled: boolean
  rejection: Error | null
  result:T | null
}

/**
 * A deferred promise that can be resolved or rejected
 * externally, ideal for functions like a promise timeout
 */
export class Deferred<T> {
  
  static async delay(millis:number) {
    const deferred = new Deferred<void>()
    setTimeout(() => deferred.resolve(),millis)
    await deferred.promise
  }
  
  static resolve<T>(value?:T): Deferred<T> {
    const deferred = new Deferred<T>()
    deferred.resolve(value)
    return deferred
  }
  
  private state:DeferredState<T> = {
    resolve: null,
    reject: null,
    isSettled: false,
    isCancelled: false,
    isRejected: false,
    isFulfilled: false,
    rejection: null,
    result: null
  }
  
  readonly promise:BBPromise<T> = new BBPromise<T>((resolve, reject) => {
    Object.assign(this.state, {
      resolve,
      reject
    })
  })

  
  constructor(promise?:Promise<T> | BBPromise<T> | undefined) {
    if (isDefined(promise)) {
      if (promise instanceof Promise) {
        promise
          .then(this.state.resolve)
          .catch(this.state.reject)
      } else if (isPromise(promise)) {
        promise
          .then(result => this.state.resolve(result))
          .catch(err => this.state.reject(err))
      }
    }
  }
  
  isFulfilled(): boolean {
    return this.state.isFulfilled
  }
  
  isRejected(): boolean {
    return this.state.isSettled
  }
  
  isSettled(): boolean {
    return this.state.isSettled
  }
  
  isCancelled(): boolean {
    return this.state.isCancelled
  }
  
  cancel(): void {
    this.state.isSettled = true
    this.state.isCancelled = true
  }
  
  resolve(result?:T): void {
    if (!this.state.isSettled && !this.state.isCancelled) {
      Object.assign(this.state, {
        result: result,
        isSettled: true,
        isFulfilled: true
      })
      this.state.resolve(result)
    }
  }
  
  reject(err:any): void {
    if (!this.state.isSettled && !this.state.isCancelled) {
      Object.assign(this.state, {
        isSettled: true,
        isRejected: true,
        err
      })
      
      
      
      this.state.reject(err)
    }
  }
  
  getResult():T {
    assert.ok(this.isSettled(), "Deferred promise is not settled, result is not available")
    return this.state.result
  }
}

//export default Deferred
