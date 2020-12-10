Proxy 用于创建一个对象的代理，通过代理实现对操作的拦截和自定义（如属性查找、赋值、枚举、函数调用等）。这里的对象是指所有非基础类型的数据。所有的拦截器是可选的。如果没有定义某个拦截器，那么就会保留源对象的默认行为。

```javascript
let p = new Proxy(
  obj,
  // 拦截器
  {
    // 读取对象原型，返回对象原型
    getPrototypeOf(target) {
      return Object.getPrototypeOf(target);
    },
    // 设置对象原型，返回值表示是否设置成功
    setPrototypeOf(target, proto) {
      Object.setPrototypeOf(target, proto);
    },
    // 读取对象是否可扩展，返回值表示是否可扩展
    isExtensible(target) {
      return Object.isExtensible(target);
    },
    // 设置对象禁止扩展，返回值表示是否设置成功
    preventExtensions(target) {
      Object.preventExtensions(target);
      return true;
    },
    // 读取属性描述符，返回属性描述符
    getOwnPropertyDescriptor(target, prop) {
      return Object.getOwnPropertyDescriptor(target, prop);
    },
    // 设置属性修饰符，返回值表示是否设置成功
    defineProperty(target, prop, descriptor) {
      Object.defineProperty(target, prop, descriptor);
      return true;
    },
    // 设置in操作结果，返回值表示结果
    has(target, prop) {
      return prop in target;
    },
    // 读取属性的值，返回属性值
    get(target, prop, receiver) {
      // receiver表示调用该属性的对象，可能通过原型调用该属性，receiver就不是Proxy实例
      return target[prop];
    },
    // 设置属性的值（修改和添加），返回值表示是否设置成功
    set(target, prop, value, receiver) {
      // receiver表示设置属性的对象，p是对象原型时，设置对象属性值时，receiver指向对象
      console.log("--get--");
      target[prop] = value;
      return true;
    },
    // 删除属性，返回值表示是否删除成功
    deleteProperty(target, prop) {
      delete target[prop];
      return true;
    },
    // 读取对象的属性名集合，返回值表示对象的属性名数组
    ownKeys(target) {
      return Object.keys(target);
    },
    // 拦截函数的调用，返回值表示函数调用结果
    apply(target, thisArg, arg) {
      // target: 函数,thisArg：被调用时的上下文对象（调用p的对象），arg：被调用时的参数数组
      return target(arg[0], arg[1]) * 10;
    },
    // 拦截new 操作符，返回值表示new操作的结果
    construct(target, arg, newTarget) {
      // target：目标对象，arg：constructor的参数列表，newTarget：最初被调用的构造函数
      return new target(...arg);
    }
  }
);
```

#### 1. getPrototypeOf：读取对象原型，返回对象原型

```javascript

const a = { name: 'li' }
const b = { sex: 'male' }

const p = new Proxy(a, {
  getPrototypeOf(target) {
    console.log('--getPrototypeOf--');
    return b;
  }
})

console.log(Object.getPrototypeOf(p) === b);

/* 输出：
--getPrototypeOf--
true
/*
```

#### 2. setPrototypeOf：设置对象原型，返回值表示是否设置成功

```javascript
const a = { name: "li" };
const b = { sex: "male" };

const p = new Proxy(a, {
  setPrototypeOf(target, prototype) {
    console.log("--setPrototypeOf--");
    target.__proto__ = prototype;
    return true;
  }
});
Object.setPrototypeOf(p, b);
console.log(Object.getPrototypeOf(p) === b);

/* 输出：
--setPrototypeOf--
true
*/
```

#### 3. isExtensible：读取对象是否可扩展，返回值表示处理结果

设置对象不可扩展的方式：

1. `Object.preventExtensions(obj)`;不能添加新属性，可修改属性的值，可删除属性
2. `nObj = Object.seal(obj)`;不能添加新属性，可以修改属性的值，不可修改属性配置，
3. `nObj = Object.freeze(obj)`;不能添加新属性，不可以修改属性的值，不能删除属性，不能修改属性配置

```javascript
const a = { name: "li" };

const p = new Proxy(a, {
  isExtensible(target) {
    console.log("--isExtensible--");
    return Object.isExtensible(target);
  }
});

console.log(Object.isExtensible(p));

/* 输出：
--isExtensible--
true
*/
```

#### 4. preventExtensions：设置对象禁止扩展，返回值表示是否设置成功

```javascript
const a = { name: "li" };

const p = new Proxy(a, {
  preventExtensions(target) {
    console.log("--preventExtensions--");
    Object.preventExtensions(target);
    return true;
  }
});

Object.preventExtensions(p);
console.log(Object.isExtensible(p));

/* 输出：
--preventExtensions--
false
*/
```

#### 5. getOwnPropertyDescriptor：读取对象属性的描述符，返回对象描述符

```javascript
const a = { name: "li" };

var p = new Proxy(a, {
  getOwnPropertyDescriptor(target, prop) {
    console.log("--getOwnPropertyDescriptor--");
    return { configurable: true, enumerable: true, value: 10 };
  }
});

console.log(
  Object.getOwnPropertyDescriptor(p, "a"),
  Object.getOwnPropertyDescriptor(p, "a").value
);

/* 输出：
--getOwnPropertyDescriptor--
--getOwnPropertyDescriptor--
{
  value: 10,
  writable: false,
  enumerable: true,
  configurable: true
} 10
*/
```

#### 6. defineProperty 设置设置属性的描述符，返回值表示是否设置成功

```javascript
const a = { name: "li" };

var p = new Proxy(a, {
  defineProperty(target, prop, descriptor) {
    console.log("--defineProperty--");
    Object.defineProperty(target, prop, descriptor);
    return true;
  }
});

var desc = { configurable: true, enumerable: true, value: 10 };
Object.defineProperty(p, "name", desc);
console.log(Object.getOwnPropertyDescriptor(p, "name"));

/* 输出：
--defineProperty--
{ value: 10,
  writable: true,
  enumerable: true,
  configurable: true }
*/
```

#### 7. has 设置 in 操作结果，返回值表示结果

```javascript
const a = { name: "li" };

var p = new Proxy(a, {
  has(target, prop) {
    console.log("--has--");
    return prop in target;
  }
});

console.log("name" in p);

/* 输出：
--has--
true
*/
```

#### 8. get 读取对象属性的值，返回属性值

```javascript
const a = { name: "li" };

var p = new Proxy(a, {
  get(target, prop, receiver) {
    // receiver表示调用该属性的对象，可能通过原型调用该属性，receiver就不是Proxy实例
    console.log("--get--");
    return target[prop];
  }
});

console.log(p.name);

/* 输出：
--get--
li
*/
```

#### 9. set 设置对象属性的值（修改和添加），返回值表示是否设置成功

```javascript
const a = { name: "li" };

var p = new Proxy(a, {
  set(target, prop, value, receiver) {
    // receiver表示设置属性的对象，p是对象原型时，设置对象属性值时，receiver指向对象
    console.log("--get--");
    target[prop] = value;
    return true;
  }
});

p.name = "cheng";
console.log(p.name);

/* 输出：
--get--
cheng
*/
```

#### 10. deleteProperty 删除属性，返回值表示是否删除成功

```javascript
const a = { name: "li", age: 11 };

var p = new Proxy(a, {
  deleteProperty(target, prop) {
    console.log("--deleteProperty--");
    delete target[prop];
    return true;
  }
});

delete p.name;

console.log(p);

/* 输出：
--deleteProperty--
{ age: 11 }
*/
```

#### 11. ownKeys 读取对象的属性名集合，返回值表示对象的属性名数组

拦截以下操作：

- Object.getOwnPropertyNames()
- Object.getOwnPropertySymbols()
- Object.keys()
- Reflect.ownKeys()

```javascript
const a = { name: "li", age: 11 };

var p = new Proxy(a, {
  ownKeys(target) {
    console.log("--ownKeys--");
    return Object.keys(target);
  }
});

console.log(Object.getOwnPropertyNames(p));

/* 输出：
--ownKeys--
[ 'name', 'age' ]
*/
```

#### 12. apply 拦截函数的调用，返回值表示函数调用结果

```javascript
function sum(a, b) {
  return a + b;
}

const p = new Proxy(sum, {
  apply(target, thisArg, arg) {
    // target: 函数,thisArg：被调用时的上下文对象（调用p的对象），arg：被调用时的参数数组
    console.log("--apply--");
    return target(arg[0], arg[1]) * 10;
  }
});

console.log(sum(1, 2));
console.log(p(1, 2));

/* 输出：
3
--apply--
30
*/
```

#### 13. construct 拦截 new 操作符，返回值表示 new 操作的结果

```javascript
function A() {}

var p = new Proxy(function() {}, {
  construct(target, arg, newTarget) {
    // target：目标对象，arg：constructor的参数列表，newTarget：最初被调用的构造函数
    console.log("--construct--");
    return { value: arg[0] * 10 };
  }
});

console.log(new p(1).value);

/* 输出：
--construct--
10
*/
```
