### data

1. 获取组件选项的 data，然后调用 data 函数，返回 data 数据。如果 data 是对象而不是函数，当存在多个该组件时，它们都会引用相同的对象导致互相影响。data 数据将会保存在组件的\_data 上。然后将\_data 的数据代理到组件上，组件内可以直接读取和更新。最后设置 data 响应式。

```javascript
function initData (vm) {
  var data = vm.$options.data;
  data = vm._data = typeof data === 'function'// 调用data函数获取数据，并赋值到组件实例_data上
    ? getData(data, vm)
    : data || {};
    ...
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  while (i--) {// 判断是否和methods和props重名
    var key = keys[i];
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {
      proxy(vm, "_data", key);// 组件代理_data数据
    }
  }
  // observe data
  observe(data, true /* asRootData */);// 响应式设置
}
```

2.调用observe根据每个值创建Observer实例，实现值的响应式。data函数返回的data对象本身就是一个值。

```javascript
function observe (value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}
```

3.根据值创建Observer实例时，先判断值是否是数组。如果是数组，更改数组的`__proto__`指向`arrayMethods`。而`arrayMethods`的`__proto__`指向`Array.prototype`（`arrayMethods = Object.create(Array.prototype)`），通过添加`arrayMethods`的中间层，可以监测到数组的更新从而通知更新。再调用实例的observeArray方法，递归设置数组元素的响应式。如果值不是数组是对象，则遍历对象，调用`defineReactive$$1`设置对象响应式。

```javascript
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    if (hasProto) {
      protoAugment(value, arrayMethods); // 将数组方法绑定在数组对象上
    } else {
      copyAugment(value, arrayMethods, arrayKeys); // 将数组方法绑定在数组对象上
    }
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};
```
```javascript
function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

/**
 * Intercept mutating methods and emit events
 * 重点
 */
methodsToPatch.forEach(function (method) {
  var original = arrayProto[method];// 缓存原生数组方法
  def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var result = original.apply(this, args);// 调用原生数组方法
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }// ？为什么push时没有遍历设置响应式
    ob.dep.notify();// 通知更新
    return result
  });
});
```
```javascript
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive$$1(obj, keys[i]);
  }
};
```
4.

```javascript
function defineReactive$$1 (
  obj,
  key,
  val,
  customSetter,
  shallow // 是否不可以修改值
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) { // 属性不可配置时则不能设置
    return
  }

  // cater for pre-defined getter/setters 在属性可能在设置可响应之前就存在get和set
  var getter = property && property.get;
  var setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) { // 疑问？：判断条件的原因
    val = obj[key];
  }

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {// 当前观察者（观察者执行渲染页面操作）
        dep.depend(); // 将当前watcher收集到依赖中
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) { return }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}
```

### props


```
### computed。
