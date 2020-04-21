main.js(入口文件):

```javascript
import Vue from "vue";
import App from "./app.vue";

new Vue({
  el: "#app",
  data() {
    return {
      person: {
        sex: "male",
        name: "Jack",
      },
    };
  },
  template:
    "<div><button @click='test'>测试</button><App :person='person'/></div>",
  components: { App },
  methods: {
    test() {
      this.person = {
        name: "Mike",
      };
    },
  },
});
```

app.vue:

```html
<template>
  <div>{{person.name}}<button @click="test">测试</button></div>
</template>

<script>
  // app组件选项
  export default {
    name: "app",
    props: ["person"],
    methods: {
      test() {
        this.person.name = "Rose";
      },
    },
  };
</script>
```

1.组件选项中的 `props` 存在多种格式，最终都会调用`normalizeProps`格式化 `props`。

```javascript
// 格式化props
function normalizeProps(options, vm) {
  var props = options.props;
  if (!props) {
    return;
  }
  var res = {};
  var i, val, name;
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === "string") {
        name = camelize(val);
        res[name] = { type: null };
      } else if (process.env.NODE_ENV !== "production") {
        warn("props must be strings when using array syntax.");
      }
    }
  } else if (isPlainObject(props)) {
    for (var key in props) {
      val = props[key];
      name = camelize(key);
      res[name] = isPlainObject(val) ? val : { type: val };
    }
  } else if (process.env.NODE_ENV !== "production") {
    warn(
      'Invalid value for option "props": expected an Array or an Object, ' +
        "but got " +
        toRawType(props) +
        ".",
      vm
    );
  }
  options.props = res;
}
```

2.main.js 中的根组件渲染页面时，先调用 `render` 函数生成组件内标签节点（VNode 实例）。生成 app 组件标签节点时，读取根组件的数据`person`赋值给 props 属性`person`，`props` 数据保存在组件标签节点上。

> 读取 `person` 属性时触发属性的 `get` 方法，收集组件更新的观察者。当修改 `person` 属性时会触发属性的 `set` 方法，通知组件更新页面。

```javascript
// main.js中根组件的template生成的render函数
function render() {
  return _c(
    "div",
    [
      _c("button", { on: { click: test } }, [_v("测试")]),
      _c(
        "App",
        { attrs: { person: person } } // app组件标签上的props数据
      ),
    ],
    1
  );
}
```

```javascript
var vnode = new VNode(
  "vue-component-" + Ctor.cid + (name ? "-" + name : ""),
  data,
  undefined,
  undefined,
  undefined,
  context,
  {
    Ctor: Ctor,
    propsData: propsData,
    listeners: listeners,
    tag: tag,
    children: children,
  }, // propsData保存了props数据
  asyncFactory
);
```

3.当渲染 app 组件标签时，会根据组件标签节点创建组件，并初始化组件数据。调用`initProps`初始化 `props`，遍历组件选项中的 `props` 属性。根据 app 组件标签上的 `props` 数据(`propsData`)，调用`validateProp`，获取属性对应的值。然后使用 `defineProperty` 定义 `props` 对象上的属性，添加`get`和`set`方法，设置 `props` 属性响应式，同时监听属性变化，当 `props` 上的属性修改时输出警告提示。最后组件代理 `props` 属性，可以在组件上直接访问 `props` 属性。

> `initProps`中定义了 `props` 对象上的属性，未定义属性值中的对象的属性。修改 `props` 对象属性的值时（例：`this.person = { name: 'Rose' }`），有警告提示，但修改值中的对象属性时（例：`this.person.name = 'Peter'`），没有警告提示。但是页面同样会更新，因为属性值来自于父组件中的 `data`，父组件中的 `data` 设置了响应式。

```javascript
// 初始化props，设置props属性值
function initProps(vm, propsOptions) {
  // propsOptions组件选项上的props
  var propsData = vm.$options.propsData || {}; //组件标签上props数据
  var props = (vm._props = {});
  var keys = (vm.$options._propKeys = []);
  var isRoot = !vm.$parent;
  if (!isRoot) {
    // 不是根组件
    toggleObserving(false); // 更改设置响应式标识（设置props对象属性响应式，不设置对象属性值响应式（对象属性值的响应式可能来自于父组件data数据）
  }
  var loop = function (key) {
    keys.push(key);
    var value = validateProp(key, propsOptions, propsData, vm); // 根据组件标签上的prop获取对应的值
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      var hyphenatedKey = hyphenate(key);
      if (
        isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)
      ) {
        warn(
          '"' +
            hyphenatedKey +
            '" is a reserved attribute and cannot be used as component prop.',
          vm
        );
      }
      defineReactive$$1(props, key, value, function () {
        // 定义props上的属性，设置get，set方法。
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            // 如果更改了props对象属性的值警告
            "Avoid mutating a prop directly since the value will be " +
              "overwritten whenever the parent component re-renders. " +
              "Instead, use a data or computed property based on the prop's " +
              'value. Prop being mutated: "' +
              key +
              '"',
            vm
          );
        }
      });
    } else {
      defineReactive$$1(props, key, value);
    }
    if (!(key in vm)) {
      proxy(vm, "_props", key); // props挂载到组件上
    }
  };

  for (var key in propsOptions) loop(key);
  toggleObserving(true);
}
```

```javascript
/**
 * 获取props属性值
 */
function validateProp(
  key, // 组件属性字段
  propOptions, // 组件属性配置
  propsData, // 组件props属性值
  vm
) {
  var prop = propOptions[key];
  var absent = !hasOwn(propsData, key);
  var value = propsData[key];
  // boolean casting
  var booleanIndex = getTypeIndex(Boolean, prop.type);
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, "default")) {
      value = false; // Boolean类型未赋值且没有默认值，则默认为false
    } else if (value === "" || value === hyphenate(key)) {
      // 值为空或者和属性名相同
      // only cast empty string / same name to boolean if
      // boolean has higher priority  Boolean类型拥有较高的优先级
      var stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        // 类型不包括字符串或者Boolean类型靠前（优先）
        value = true;
      }
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value); // 对默认值设置响应式
    toggleObserving(prevShouldObserve);
  }
  if (
    process.env.NODE_ENV !== "production" &&
    // skip validation for weex recycle-list child component props
    !false
  ) {
    assertProp(prop, key, value, vm, absent);
  }
  return value;
}
```

4.初始化 `data`、`props` 等 app 组件数据后，开始渲染页面。调用 `render` 时创建标签节点，依次读取了 `props` 属性上的 `person` 和 `name` 属性。根据创建的标签节点生成 DOM 元素，添加到页面中。

> 读取 `person` 属性时，app 组件 `props` 中的 `person` 属性会收集 app 组件更新的观察者。读取 `name` 属性时，根组件 data 中的 `name` 属性会收集 app 组件更新的观察者。

```javascript
// app组件template生成的render函数
function render() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [
    _vm._v(_vm._s(_vm.person.name)), // 依次读取了props属性上的person和name属性
    _c("button", { on: { click: _vm.test } }, [_vm._v("测试")]),
  ]);
}
```

5.点击根组件中的按钮触发 test 函数，修改 `person` 时，将会触发根组件页面更新，更新过程中调用`updateChildComponent`更新子组件标签上的数据，修改 `props` 的属性 `person`，触发 `set` 方法，通知 app 组件也更新页面，app 组件将根据修改后的 props 属性值渲染页面。

```javascript
function updateChildComponent (
  vm,
  propsData,
  listeners,
  parentVnode,
  renderChildren
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true;// 标识说明正在更新组件
  }
    ...
  vm.$attrs = parentVnode.data.attrs || emptyObject;
  vm.$listeners = listeners || emptyObject;

  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false);
    var props = vm._props;
    var propKeys = vm.$options._propKeys || [];
    for (var i = 0; i < propKeys.length; i++) {
      var key = propKeys[i];
      var propOptions = vm.$options.props; // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm);// 更新props属性值
    }
    toggleObserving(true);
    // keep a copy of raw propsData
    vm.$options.propsData = propsData;
  }
    ...
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false;
  }
}
```

6.点击 app 组件中的按钮触发 `test` 函数，修改 `person` 上的 `name` 属性，触发 `name` 属性上的 `set` 方法，通知 app 组件更新页面。

> 在根组件内修改 `person` 的 `name` 属性，和在 app 组件内修改 `person` 的 `name` 属性是一样的，都会触发 app 组件页面更新。
