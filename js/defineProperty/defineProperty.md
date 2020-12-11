## Object.definePropery

用法：
```javascript
Object.defineProperty(obj, key, {
    value: 1,
    writable: false,
    configurable: false,
    enumerable: false,
    get() { return 1 },
    set(val) {}
})
```

描述符：

  - 数据描述符：

    - configurable：
        - 属性描述符是否可修改
        - defineProperty设置属性但没configurable描述符时，该值默认为false
        - 当且仅当该值为 true 时，该属性的描述符才能够被改变（修改报错或者无效），才可以删除

    - enumerable：
        - 属性是否可以被对象枚举
        - defineProperty设置属性但没enumerable描述符时，该值默认为false
        - 且仅当该值为 true 时，该属性才会出现在对象的枚举属性中

    - writable：
        - 值是否可更改
        - defineProperty设置属性但没writable描述符时，该值默认为false
        - 当且仅当该值为 true 时，属性的值才能被赋值运算符改变。
    - value：
        - 属性的值
        - defineProperty设置属性但没value描述符时，该值默认为 undefined

  - 存取描述符

    - get：
        - 属性的 getter 函数。
        - 当访问该属性时，会调用此函数。该函数的返回值会被用作属性的值。
        - 执行时不传入任何参数，但是会传入 this 对象（由于继承关系，这里的this并不一定是定义该属性的对象）。
        
    - set：
        - 属性的 setter 函数。
        - 当属性值被修改时，会调用此函数。
        - 该方法接受一个参数（也就是被赋予的新值）。

