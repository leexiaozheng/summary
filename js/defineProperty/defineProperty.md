## Object.definePropery

用法：

```javascript
Object.defineProperty(
  // 要定义属性的对象
  obj,
  //要定义或修改的属性的名称或 Symbol
  key,
  // 属性描述符。
  {
    value: 1,
    writable: false,
    configurable: false,
    enumerable: false,
    get() {
      return 1;
    },
    set(val) {}
  }
);
```

对象里目前存在的属性描述符有两种主要形式：数据描述符和存取描述符。数据描述符是一个具有值的属性，该值可以是可写的，也可以是不可写的。存取描述符是由 getter 函数和 setter 函数所描述的属性。**一个描述符只能是这两者其中之一；不能同时是两者。**

描述符：

- 数据描述符：

  - configurable：

    - 属性描述符是否可修改
    - defineProperty 设置属性但没 configurable 描述符时，该值默认为 false
    - 当且仅当该值为 true 时，该属性的描述符才能够被改变（修改报错或者无效），才可以删除

  - enumerable：

    - 属性是否可以被对象枚举
    - defineProperty 设置属性但没 enumerable 描述符时，该值默认为 false
    - 且仅当该值为 true 时，该属性才会出现在对象的枚举属性中

  - writable：
    - 值是否可更改
    - defineProperty 设置属性但没 writable 描述符时，该值默认为 false
    - 当且仅当该值为 true 时，属性的值才能被赋值运算符改变。
  - value：
    - 属性的值
    - defineProperty 设置属性但没 value 描述符时，该值默认为 undefined

- 存取描述符

  - get：
    - 属性的 getter 函数。
    - 当访问该属性时，会调用此函数。该函数的返回值会被用作属性的值。
    - 执行时不传入任何参数，但是会传入 this 对象（由于继承关系，这里的 this 并不一定是定义该属性的对象）。
  - set：
    - 属性的 setter 函数。
    - 当属性值被修改时，会调用此函数。
    - 该方法接受一个参数（也就是被赋予的新值），会传入赋值时的 this 对象。

> 如果一个描述符不具有 value、writable、get 和 set 中的任意一个键，那么它将被认为是一个数据描述符。如果一个描述符同时拥有 value 或 writable 和 get 或 set 键，则会产生一个异常。
