// let obj = {
//     name: 'li',
//     work: {
//         company: 'geely'
//     }
// }
// let arr = ['1', '2', '3', '4'];

// let p1 = new Proxy(arr, {
//     set(obj, prop, val) {
//         debugger;
//     }
// });
// const a = { name: 'li' }
// const b = { sex: 'male' }

// const p = new Proxy(a, {
//   getPrototypeOf(target) {
//     console.log('--getPrototypeOf--');
//     return b;
//   }
// })

// console.log(Object.getPrototypeOf(p) === b);
// const a = { name: 'li' }
// const b = { sex: 'male' }

// const p = new Proxy(a, {
//   setPrototypeOf(target, prototype) {
//     console.log('--setPrototypeOf--');
//     target.__proto__ = prototype
//     return true;
//   }
// })
// Object.setPrototypeOf(p, b)
// console.log(Object.getPrototypeOf(p) === b);


// const a = { name: 'li' }

// const p = new Proxy(a, {
//   isExtensible(target) {
//     console.log('--isExtensible--');
//     return Object.isExtensible(target);
//   }
// })

// console.log(Object.isExtensible(p));


  
//   const a = { name: 'li' }
  
//   var p = new Proxy(a, {
//     getOwnPropertyDescriptor: function(target, prop) {
//       console.log('--getOwnPropertyDescriptor--');
//       return { configurable: true, enumerable: true, value: 10 };
//     }
//   });
  
//   console.log(Object.getOwnPropertyDescriptor(p, 'a'), Object.getOwnPropertyDescriptor(p, 'a').value);

// const a = { name: 'li' }

// var p = new Proxy(a, {
//   defineProperty: function(target, prop, descriptor) {
//     console.log('--defineProperty--');
//     Object.defineProperty(target, prop, descriptor)
//     return true;
//   }
// });

// var desc = { configurable: true, enumerable: true, value: 10 };
// console.log(Object.defineProperty(p, 'name', desc), Object.getOwnPropertyDescriptor(p, 'name'));

// const a = { name: 'li' }

// var p = new Proxy(a, {
//   has: function(target, prop) {
//     console.log('--has--');
//     return prop in target;
//   }
// });

// console.log('name' in p); 

// const a = { name: 'li' }

// var p = new Proxy(a, {
//   get: function(target, prop, receiver) {// receiver表示调用该属性的对象，可能通过原型调用该属性，receiver就不是Proxy实例
//     console.log('--get--');
//     return target[prop];
//   }
// });

// console.log(p.name); 


// const a = { name: 'li' }

// var p = new Proxy(a, {
//   set: function(target, prop, value, receiver) {// receiver表示设置属性的对象，p是对象原型时，设置对象属性值时，receiver指向对象
//     console.log('--get--');
//     target[prop] = value;
//     return true;
//   }
// })

// p.name = 'cheng'
// console.log(p.name);

// const a = { name: 'li', age: 11 }

// var p = new Proxy(a, {
//   deleteProperty: function(target, prop) {
//     console.log('--deleteProperty--');
//     delete target[prop]
//     return true;
//   }
// });

// delete p.name;

// console.log(p);

// const a = { name: 'li', age: 11 }

// var p = new Proxy(a, {
//   ownKeys: function(target) {
//     console.log('--ownKeys--');
//     return Object.keys(target);
//   }
// });

// console.log(Object.getOwnPropertyNames(p));

// function sum(a, b) {
//     return a + b;
//   }
  
//   const p = new Proxy(sum,  {
//     apply: function(target, thisArg, arg) { // target: 函数,thisArg：被调用时的上下文对象（调用p的对象），arg：被调用时的参数数组
//       console.log('--apply--');
//       return target(arg[0], arg[1]) * 10;
//     }
//   });
  
//   console.log(sum(1, 2));
//   console.log(p(1, 2));

function A() {}

var p = new Proxy(function() {}, {
  construct: function(target, argumentsList, newTarget) {// target：目标对象，argumentsList：constructor的参数列表，newTarget：最初被调用的构造函数
    console.log('--construct--');
    return { value: argumentsList[0] * 10 };
  }
});

console.log(new p(1).value);