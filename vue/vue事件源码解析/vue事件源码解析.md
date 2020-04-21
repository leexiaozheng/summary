1.标签上各种事件编译的结果：

- `<button @click="test">测试</button>`中事件编译成`{on:{"test":test}}`对象
- `<button @click.stop="test">测试</button>`中事件编译成`{on:{"click":function($event){$event.stopPropagation();return test($event)}}}`对象
- `<app @test="test" />`编译成`{on:{"test":test}}`对象
- `<app @test="test(1)" />`中事件编译成`{"test":function($event){return test(1)}}`对象
- `<app @click.native="test" />`中编译成`{nativeOn:{"click":function($event){return test($event)}}`对象

2.根据标签创建节点（VNode实例）时，标签上原生事件编译成的数据对象保存在节点的data属性上。 组件标签上的自定义事件编译成的数据对象，保存在节点的组件数据中的listerners属性上。

> 原生事件是指原生标签上的事件或者组件标签上添加了native修复符的事件

```javascript
function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (isUndef(Ctor)) {
    return
  }

  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }
    ...

  var listeners = data.on;// 组件标签上的自定义事件
  data.on = data.nativeOn;// 组件标签上的原生事件
    ...


  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context, // // data保存原生事件信息
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },// listeners保存组件标签上自定义事件信息
    asyncFactory
  );

  return vnode
}
```


3.创建组件实例时调用initEvents初始化事件，

绑定到组件上的原生事件在生成组件并完成初始化后，插入到 DOM 之前，调用节点 create 生命周期时，添加到组件根 DOM 元素上。

```javascript
// 处理自定义事件
function initEvents(vm) {
    vm._events = Object.create(null);
    vm._hasHookEvent = false;
    // init parent attached events
    var listeners = vm.$options._parentListeners;
    if (listeners) {
        updateComponentListeners(vm, listeners);
    }
}
```

```javascript
// 处理组件时的原生事件
function updateDOMListeners (oldVnode, vnode) {// 更新原生DOM上的事件
    ...
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  normalizeEvents(on);
  updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
  target$1 = undefined;
}

var events = {
  create: updateDOMListeners,
  update: updateDOMListeners
};

// 在原生DOM上添加事件
function add$1 (
  name,
  handler,
  capture,
  passive
) {
  ...
  target$1.addEventListener(
    name,
    handler,
    supportsPassive
      ? { capture: capture, passive: passive }
      : capture
  );
}

```
