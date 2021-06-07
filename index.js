// const Promise = require('./Promise');

// const promise = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('成功');
//   }, 5000);
// });

// // promise.then().then().then((data) => {
// //   console.log('data', data);
// // })

// // Promise.resolve(promise).then(data => {
// //   console.log(data);
// // });

// Promise.prototype.finally = function (callback) {
//   return this.then(
//     value => {
//       return Promise.resolve(callback()).then(() => value);
//     },
//     reason => {
//       return Promise.resolve(callback()).then(() => {
//         throw reason;
//       });
//     }
//   );
// };

// const wrap = promise => {
//   let abort
//   const _p = new Promise((resolve, reject) => {
//     abort = reject
//   })
//   const p = Promise.race([promise, _p])
//   p.abort = abort
//   return p
// }

// const p = wrap(promise)
// p.then((data) => {
//   console.log(data);
// }).catch((err) => {
//   console.log(err);
// })

// setTimeout(() => {
//   p.abort('超时')
// }, 2000);
// // promise.then(
// //   data => {
// //     console.log('suc2', data);
// //   },
// //   err => {
// //     console.log('err2', err);
// //   }
// // );

// function * gen() {
//   this.a = 1
//   yield this.b = 2
//   yield this.c = 3
// }

// function F() {
//   return gen.call(gen.prototype)
// }

// const f = new F()

// console.log(f.next())
// // console.log(f.next())
// // console.log(f.next())

// console.log(f.a);
// console.log(f.b);
// console.log(f.c);

// console.log(f.next())
// console.log(f.next())
