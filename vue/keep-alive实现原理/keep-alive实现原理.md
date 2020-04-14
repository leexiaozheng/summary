1.keep-alive 组件的 props:

- `include` - 字符串或正则表达式。只有名称匹配的组件会被缓存。
- `exclude` - 字符串或正则表达式。任何名称匹配的组件都不会被缓存。
- `max` - 数字。最多可以缓存多少组件实例。

  2.keep-alive 是 vue 的内建组件，所有组件可以通过 components 获取 keep-alive 组件选项（内建组件是以原型的形式保存在 components 对象上，而不是直接保存在 components 上），根据获取到的组件选项创建 keep-alive 组件。

```javascript
// keep-alive组件选项
var KeepAlive = {
    name: 'keep-alive',
    abstract: true, // 抽象组件
    props: {
        ...
    },
    created: function created() {
        this.cache = Object.create(null);// 缓存组件
        this.keys = [];// 缓存组件标识
    },
    mouted: {
        ...
    },
    render: {
        ...
    }
};
```

3.keep-alive 组件渲染页面调用 render 函数时，先获取 keep-alive 组件标签内的组件标签节点（默认插槽生成的节点，VNode 实例）。再根据组件名称判断节点是否满足缓存的条件，如果不满足直接返回节点，否则判断该节点是否已经缓存。如果已经缓存，直接读取之前缓存的组件（Vue 实例），保存到当前节点上，然后返回当前节点。如果未缓存，则缓存当前节点后再返回。缓存的内容是组件，组件自身包含了数据状态，根据数据渲染页面，所以组件激活时能够保持之前的状态。

```javascript
// keep-alive render函数
render: function render() {
  var slot = this.$slots.default; // 获取组件内标签节点
  var vnode = getFirstComponentChild(slot);
  var componentOptions = vnode && vnode.componentOptions;
  if (componentOptions) {
    // check pattern
    var name = getComponentName(componentOptions); // 获取组件名称
    var ref = this;
    var include = ref.include;
    var exclude = ref.exclude;
    if (
      // not included
      (include && (!name || !matches(include, name))) || // include中没有name
      // excluded
      (exclude && name && matches(exclude, name)) // exclude中有name
    ) {
      return vnode; // 不缓存直接返回
    }

    var ref$1 = this;
    var cache = ref$1.cache;
    var keys = ref$1.keys;
    var key =
      vnode.key == null
        ? // same constructor may get registered as different local components
          // so cid alone is not enough (#3269)
          componentOptions.Ctor.cid +
          (componentOptions.tag ? "::" + componentOptions.tag : "")
        : vnode.key;
    if (cache[key]) {
      // 直接读取缓存组件
      vnode.componentInstance = cache[key].componentInstance;
      // make current key freshest
      remove(keys, key);
      keys.push(key);
    } else {
      // 添加组件缓存
      cache[key] = vnode;
      keys.push(key);
      // prune oldest entry
      if (this.max && keys.length > parseInt(this.max)) {
        // 超出最大数量限制，销毁最先换成的节点实例(max为字符串0时会报错)
        pruneCacheEntry(cache, keys[0], keys, this._vnode);
      }
    }

    vnode.data.keepAlive = true; // 组件缓存标识，保证组件不被销毁
  }
  return vnode || (slot && slot[0]);
}
```

4.缓存组件激活（节点 DOM 插入到页面）时，调用`activated`组件生命周期函数。当缓存组件标签切换，组件节点销毁时，由于组件节点标识 keepAlive 为 true，并不会调用\$destory 销毁组件，而是冻结组件并触发`deactivated`组件生命周期函数。

```javascript
// 节点生命周期
var componentVNodeHooks = {
    ...
    insert: function insert (vnode) {
        var context = vnode.context;
        var componentInstance = vnode.componentInstance;
        if (!componentInstance._isMounted) {
        componentInstance._isMounted = true;
        callHook(componentInstance, 'mounted');// 插入到DOM后触发
        }
        if (vnode.data.keepAlive) {
        if (context._isMounted) {
            // vue-router#1212
            // During updates, a kept-alive component's child components may
            // change, so directly walking the tree here may call activated hooks
            // on incorrect children. Instead we push them into a queue which will
            // be processed after the whole patch process ended.
            queueActivatedComponent(componentInstance);
        } else {
            activateChildComponent(componentInstance, true /* direct */);// 激活组件
        }
        }
    },
    ...
    destroy: function destroy (vnode) {// 节点销毁时的生命周期函数
        var componentInstance = vnode.componentInstance;
        if (!componentInstance._isDestroyed) {
        if (!vnode.data.keepAlive) {// 是不是keep-alive中的缓存组件
            componentInstance.$destroy();
        } else {
            deactivateChildComponent(componentInstance, true /* direct */);
        }
        }
    }
};
// 激活组件
function activateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = false;
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false;
    for (var i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'activated');
  }
}
// 冻结组件
function deactivateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = true;
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true;
    for (var i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i]);// 冻结子组件
    }
    callHook(vm, 'deactivated');// 调用组件冻结生命周期函数
  }
}
```

5.keep-alive 是通过 include 和 exclude 判断组件是否缓存。在 keep-alive 组件 mounted 生命周期函数中，通过组件内置的\$watch 方法监测测 include 和 exclude 值的变化，当发生变化时，根据变化后的值判断当前已经缓存的组件哪些不满足缓存条件，不满足缓存条件的清除组件缓存。通过 include 和 exclude 可以实现动态缓存，例如人员列表页面跳转到车辆列表页面不缓存，但是跳转到人员详情页缓存，就可以页面跳转前更改 include 或者 exclude 值，更新缓存条件，实现动态缓存。

```javascript
// keep-alive props
props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number],
}
```

```javascript
// keep-alive mouted生命周期函数
mounted: function mounted() {
  var this$1 = this;

  this.$watch("include", function (val) {
    // 监测include属性值变化
    pruneCache(this$1, function (name) {
      return matches(val, name);
    }); // 当组件不满足缓存条件时销毁
  });
  this.$watch("exclude", function (val) {
    // 监测exclude属性值变化
    pruneCache(this$1, function (name) {
      return !matches(val, name);
    }); // 当组件不满足缓存条件时销毁
  });
}
```

6.`keep-alive`组件销毁时，同时也会销毁缓存的组件。

```javascript
// keep-alive destroyed生命周期函数
destroyed: function destroyed() {
  for (var key in this.cache) {
    pruneCacheEntry(this.cache, key, this.keys); // 销毁组件
  }
}
```
