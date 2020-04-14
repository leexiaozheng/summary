1. 根据组件标签生成节点（VNode实例）时，props属性名和属性值以键值对形式保存在节点上(propsData)。

```javascript
var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },// propsData保存了props键值对
    asyncFactory
  );

```

2. 生成组件初始化props时，将props属性挂载到组件上，并将保存的props值赋值到属性上。设置props为响应式，监测props值的变化。

```javascript
// 初始化props，设置props属性值
function initProps (vm, propsOptions) {
  var propsData = vm.$options.propsData || {};//组件标签上props
  var props = vm._props = {};
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  var keys = vm.$options._propKeys = [];
  var isRoot = !vm.$parent;
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false);
  }
  var loop = function ( key ) {
    keys.push(key);
    var value = validateProp(key, propsOptions, propsData, vm);// 根据组件标签上的prop获取对应的值
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      var hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive$$1(props, key, value, function () {// 设置prop响应式，并且添加提示不能直接更改props属性值
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    } else {
      defineReactive$$1(props, key, value);
    }
    if (!(key in vm)) {
      proxy(vm, "_props", key);//组件实例代理props
    }
  };

  for (var key in propsOptions) loop( key );
  toggleObserving(true);
}
```

3. 当组件标签上的props属性值发生变化时，又会重新生成组件节点，执行以上的操作，对组件上的props属性重新赋值，而组件内引用该props属性的页面将会通知更新（响应式）。