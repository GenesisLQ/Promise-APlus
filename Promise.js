const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

const isPromise = value => typeof value.then === 'function';

const resolvePromise = (promise2, x, resolve, reject) => {
  // 如果 promise2 和 x 是同一个对象，抛出一个循环引用的错误
  if (promise2 === x) {
    return reject(
      new TypeError('Chaining cycle detected for promise #<Promise>')
    );
  }

  // 如果 resolvePromise 或 rejectPromise 被调用过了，就不会再次调用
  let called = false;

  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    try {
      const then = x.then;

      // 认为 x 就是一个 Promise
      if (typeof then === 'function') {
        // 不要写成 x.then，因为 x.then 会再次取值，有可能又出错
        // 这里直接拿第一次取值的 then 就行了
        then.call(
          x,
          y => {
            if (called) return;
            called = true;

            // 如果 y 还是一个 promise 就需要递归解析
            resolvePromise(promise2, y, resolve, reject);
          },
          e => {
            reject(e);
          }
        );
      } else {
        // x 是一个普通对象
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      // 取值出错
      reject(error);
    }
  } else {
    resolve(x);
  }
};

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined; // 失败的原因
    this.onFulfilledCallbacks = []; // 成功回调
    this.onRejectedCallbacks = []; // 失败回调

    /**
     * resolve 方法，只有当前状态为 pending 时才能改状态
     * 将 Promise 状态改为 fulfilled
     * 调用 resolve 时将所有成功回调函数依次执行
     */
    const resolve = value => {
      // 如果 resolve 方法里是一个 Promise，就需要递归解析
      if (value instanceof Promise) {
        return value.then(resolve, reject);
      }

      if (this.status === PENDING) {
        this.value = value;
        this.status = FULFILLED;
        this.onFulfilledCallbacks.forEach(fn => fn());
      }
    };

    /**
     * reject 方法，只有当前状态为 pending 时才能改状态
     * 将 Promise 状态改为 rejected
     * 调用 reject 时将所有失败回调函数依次执行
     */
    const reject = reason => {
      if (this.status === PENDING) {
        this.reason = reason;
        this.status = REJECTED;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };

    // 立即执行。如果执行出错了，也会直接变成 rejected
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : err => {
            throw err;
          };

    const promise2 = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        // 必须要保证 onFulfilled 和 onRejected 是在异步执行的
        // 为了拿到 promise2 的这个实例，需要延迟去执行，这里使用了 setTimeout
        // 但是在浏览器的实现中，会把这个定时器改造成微任务，以便更快的执行回调，这就是为什么 Promise 是微任务的原因
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }

      // 如果当前的状态是 pending，我们需要将成功和失败的回调存起来，等到状态改变时再一起执行
      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });

    return promise2;
  }

  catch(errorCallback) {
    return this.then(null, errorCallback);
  }

  static resolve(value) {
    return new Promise((resolve, reject) => {
      resolve(value);
    });
  }

  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      let arr = [];
      let count = 0;
      const processData = (index, data) => {
        // 使用一个数组将所有执行的结果保存
        arr[index] = data;
        // 说明所有的 Promise 都执行完毕，将结果返回
        if (++count === promises.length) {
          resolve(arr);
        }
      };
      for (let i = 0; i < promises.length; i++) {
        const result = promises[i];
        // 如果是一个 Promise，需要等到 Promise 状态改变后再把结果返回
        if (isPromise(result)) {
          result.then(data => {
            processData(i, data);
          }, reject);
        } else {
          processData(i, result);
        }
      }
    });
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const result = promises[i];
        if (isPromise(result)) {
          result.then(resolve, reject);
        } else {
          resolve(result);
        }
      }
    });
  }
}

module.exports = Promise;
