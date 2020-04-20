1.根据组件标签生成节点（VNode实例）时，props属性名和属性值以键值对形式保存在节点上(propsData)。

```javascript
var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },// propsData保存了props键值对
    asyncFactory
  );

```

2.创建组件实例时，初始化`props`，获取组件标签上的`props`键值对数据`propsData`，遍历组件选项中的`props`属性，根据`propsData`获取属性对应的值，并将`props`属性定义到组件`_props`上，并实现属性的响应式，再由组件代理`_props`上的属性，使属性的上下文指向组件。

```javascript
// 初始化props
function initProps (vm, propsOptions) {
  var propsData = vm.$options.propsData || {};//组件标签上props数据
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
      defineReactive$$1(props, key, value, function () {// 设置prop响应式，当更改props属性时警告（更改props属性值里的属性时无警告）
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

3.当赋值给props属性的父组件data值修改时，页面更新，又会重新生成标签节点，执行以上的操作，对组件上的props属性重新赋值，而组件内引用该props属性的页面将会通知更新（响应式）。