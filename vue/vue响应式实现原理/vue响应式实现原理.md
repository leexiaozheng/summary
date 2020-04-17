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

2.

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

### props


```
### computed。
