const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';
global.index = 0
global.promises = []

function isPromise(p) {
  return typeof p.then === 'function'
}

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('循环引用'));
  }

  // 如果 x 是一个 Promise，且同时调用了 resolve 和 reject ，以第一次为准
  // 所以用一个变量控制
  let called = false;

  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    try {
      const _then = x.then;
      if (typeof _then === 'function') {
        try {
          _then.call(
            x,
            y => {
              if (called) return;
              called = true;
              resolvePromise(promise2, y, resolve, reject);
            },
            r => {
              reject(r);
            }
          );
        } catch (e) {
          if (called) return;
          called = true;
          reject(e);
        }
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    resolve(x);
  }
}

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.fulfilledCbs = [];
    this.rejectedCbs = [];
    this.id = ++index

    const resolve = value => {
      if (value instanceof Promise) {
        return value.then(resolve, reject);
      }
      if (this.status === PENDING) {
        this.status = RESOLVED;
        this.value = value;
        this.fulfilledCbs.forEach(cb => cb());
      }
    };

    const reject = reason => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.rejectedCbs.forEach(cb => cb());
      }
    };

    try {
      executor(resolve, reject);
      promises.push(this)
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    typeof onFulfilled === 'function' ? onFulfilled : v => v;
    typeof onRejected === 'function'
      ? onRejected
      : r => {
          throw new Error(r);
        };

    const promise2 = new Promise((resolve, reject) => {
      if (this.status === RESOLVED) {
        process.nextTick(() => {
          try {
            const x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === REJECTED) {
        process.nextTick(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      if (this.status === PENDING) {
        this.fulfilledCbs.push(() => {
          process.nextTick(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
        this.rejectedCbs.push(() => {
          process.nextTick(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    });

    return promise2;
  }

  catch(onErrorCallback) {
    this.then(null, onErrorCallback)
  }
  
  static resolve(value) {
    return new Promise((resolve, reject) => {
      resolve(value)
    })
  }

  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      const result = []
      let count = 0
      const processData = (index, data) => {
        result[index] = data
        if (++count === promises.length) {
          resolve(result)
        }
      }
      for (let i = 0; i < promises.length; i++) {
        const p = promises[i];
        if (isPromise(p)) {
          p.then((data) => processData(i, data), reject)
        } else {
          Promise.resolve(data).then((data) => processData(i, data))
        }
      }
    })
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const p = promises[i];
        if (isPromise(p)) {
          p.then(resolve, reject)
        } else {
          Promise.resolve(p).then(resolve, reject)
        }
      }
    })
  }
}

module.exports = Promise;
