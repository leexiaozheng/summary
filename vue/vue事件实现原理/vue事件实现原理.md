1. 标签上的事件编译出来有两种情况：

-   `<app @test="test" />`编译成`{on:{"test":test}}`：自定义事件绑定在组件上

-   `<app @click="test" />`编译成`{nativeOn:{"click":function($event){return test($event)}}` 原生事件绑定到组件上

1.  新建组件节点 VNode 实例时，自定义事件信息保存在节点的 componentOpions 上的 listeners 属性上，原生事件绑定到组件的事件信息保存在节点（VNode 实例）的 data 属性上。

2.  自定义事件在生成组件实例时调用 initEvents 添加，绑定到组件上的原生事件在生成组件并完成初始化后，插入到 DOM 之前，调用节点 create 生命周期时，添加到组件根 DOM 元素上。

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
