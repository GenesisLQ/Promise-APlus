# Promise A+

> promise a+ 规范的实现



## 为什么产生 Promise

解决异步问题：

1. 多个异步请求并发（希望同步最终的结果）
2. 链式异步请求的问题，上一个的输入是下一个的输出

缺点：

1. 无法取消。一旦新建它就会立即执行，无法中途取消
2. 如果不设置回调函数，Promise 内部抛出的错误，不会反应到外部
3. 当处于 Pending 状态时，无法判断进展到哪一个阶段（刚开始还是即将完成）



## 什么是 Promise

Promise 是一个状态容器，里面放着未来才会结束的事件，Promise 状态有三种状态：

- `Pending`: 进行中
- `fulfilled`: 成功
- `Rejected`: 失败

> Promise 的状态一旦改变就不能再变了

Promise 默认执行器立即执行

```js
const promise = new Promise((resolve, reject) => {
  console.log(1)
})
console.log(2)

// 1 2
```

## promise.then

可能调用 `then` 方法时当时的状态还是 pending，这个时候就需要使用**发布订阅模式**了，如果当前的状态是 pending，我们需要将成功和失败的回调存起来，等到状态改变时再一起执行