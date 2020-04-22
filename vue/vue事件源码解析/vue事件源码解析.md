1.vue.js 执行时，会调用 `eventsMixin` 方法，添加事件相关的方法到 Vue 原型上，组件（Vue 实例）可以调用这些事件方法。

-   调用 `$on`方法添加组件标签上的自定义事件，事件保存在组件的`_events`对象上，对象属性名为事件名称，属性值为事件回调函数集合。
-   调用`$emit`方法触发保存的自定义事件，根据事件名找到事件回调函数集合，然后依次调用事件的回掉函数，并传入`$emit`方法中的第一个参数后的所有参数。
-   调用`$off`移除自定义事件，如果传了事件名和回调函数两个参数，则移除该事件中的这个回调函数，如果只传了事件名，则移除该事件的所有回调函数。
-   调用`$once`方法添加组件标签上的自定义事件，该事件触发一次后销毁。该方法中调用`$on`方法添加事件，同时封装事件的回调函数，当触发该事件的回调函数时，先调用`$off`移除回掉函数，再执行原始的回掉函数。

```javascript
function eventsMixin(Vue) {
    var hookRE = /^hook:/;
    Vue.prototype.$on = function (event, fn) {
        var vm = this;
        if (Array.isArray(event)) {
            for (var i = 0, l = event.length; i < l; i++) {
                vm.$on(event[i], fn);
            }
        } else {
            (vm._events[event] || (vm._events[event] = [])).push(fn);
            // optimize hook:event cost by using a boolean flag marked at registration
            // instead of a hash lookup
            if (hookRE.test(event)) {
                vm._hasHookEvent = true;
            }
        }
        return vm;
    };

    Vue.prototype.$once = function (event, fn) {
        var vm = this;
        function on() {
            vm.$off(event, on);
            fn.apply(vm, arguments);
        }
        on.fn = fn;
        vm.$on(event, on);
        return vm;
    };

    Vue.prototype.$off = function (event, fn) {
        var vm = this;
        // all
        if (!arguments.length) {
            vm._events = Object.create(null);
            return vm;
        }
        // array of events
        if (Array.isArray(event)) {
            for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
                vm.$off(event[i$1], fn);
            }
            return vm;
        }
        // specific event
        var cbs = vm._events[event];
        if (!cbs) {
            return vm;
        }
        if (!fn) {
            vm._events[event] = null;
            return vm;
        }
        // specific handler
        var cb;
        var i = cbs.length;
        while (i--) {
            cb = cbs[i];
            if (cb === fn || cb.fn === fn) {
                cbs.splice(i, 1);
                break;
            }
        }
        return vm;
    };

    Vue.prototype.$emit = function (event) {
        var vm = this;
        if (process.env.NODE_ENV !== 'production') {
            var lowerCaseEvent = event.toLowerCase();
            if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
                tip(
                    'Event "' +
                        lowerCaseEvent +
                        '" is emitted in component ' +
                        formatComponentName(vm) +
                        ' but the handler is registered for "' +
                        event +
                        '". ' +
                        'Note that HTML attributes are case-insensitive and you cannot use ' +
                        'v-on to listen to camelCase events when using in-DOM templates. ' +
                        'You should probably use "' +
                        hyphenate(event) +
                        '" instead of "' +
                        event +
                        '".'
                );
            }
        }
        var cbs = vm._events[event];
        if (cbs) {
            cbs = cbs.length > 1 ? toArray(cbs) : cbs;
            var args = toArray(arguments, 1);
            var info = 'event handler for "' + event + '"';
            for (var i = 0, l = cbs.length; i < l; i++) {
                invokeWithErrorHandling(cbs[i], vm, args, vm, info);
            }
        }
        return vm;
    };
}
```

2.模板中标签上各种事件编译的结果：

-   `<button @click="test">测试</button>`中事件编译成`{on:{"test":test}}`对象
-   `<button @click.stop="test">测试</button>`中事件编译成`{on:{"click":function($event){$event.stopPropagation();return test($event)}}}`对象
-   `<app @test="test" />`编译成`{on:{"test":test}}`对象
-   `<app @test="test(1)" />`中事件编译成`{"test":function($event){return test(1)}}`对象
-   `<app @click.native="test" />`中编译成`{nativeOn:{"click":function($event){return test($event)}}`对象

> 组件选项中的`metheds`中方法都会被重新封装，保持方法中的`this`指向组件（Vue 实例），即事件回调函数`this`指向它所在的组件。

3.根据标签创建节点（VNode 实例）时，标签上原生事件编译成的数据对象保存在节点的`data`属性上。 组件标签上的自定义事件编译成的数据对象，保存在节点的组件数据中的`listerners`属性上。

> 原生事件是指原生标签上的事件或者组件标签上添加了`native`修复符的事件。

```javascript
// 创建组件节点
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

3.调用`updateComponentListeners`创建或者更新组件标签上自定义事件。调用组件`$on`方法添加事件回调函数。添加之前会封装回调函数，将原始回调函数保存到封装后的函数的属性`fns`上，在封装的回调函数中调用`fns`。

> 当事件的回调函数更改时，原生事件也不要重新添加事件监听，只要更新回掉函数上的`fns`属性。

```javascript
var target;

function add(event, fn) {
    // 添加绑定在组件标签上的事件
    target.$on(event, fn);
}

function remove$1(event, fn) {
    // 移除绑定在组件标签上的事件
    target.$off(event, fn);
}

function createOnceHandler(event, fn) {
    // 添加绑定在组件标签上的事件，事件触发之后移除
    var _target = target;
    return function onceHandler() {
        var res = fn.apply(null, arguments);
        if (res !== null) {
            _target.$off(event, onceHandler);
        }
    };
}

function updateComponentListeners(vm, listeners, oldListeners) {
    target = vm;
    updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm); // 创建或者更新自定义事件
    target = undefined;
}
function updateListeners(on, oldOn, add, remove$$1, createOnceHandler, vm) {
    var name, def$$1, cur, old, event;
    for (name in on) {
        def$$1 = cur = on[name];
        old = oldOn[name];
        event = normalizeEvent(name); // 获取事件上的修饰符
        if (isUndef(cur)) {
            process.env.NODE_ENV !== 'production' && warn('Invalid handler for event "' + event.name + '": got ' + String(cur), vm);
        } else if (isUndef(old)) {
            if (isUndef(cur.fns)) {
                cur = on[name] = createFnInvoker(cur, vm); // 封装回调函数：将原始回调函数绑定封装的回调函数fn属性上。
            }
            if (isTrue(event.once)) {
                cur = on[name] = createOnceHandler(event.name, cur, event.capture);
            }
            add(event.name, cur, event.capture, event.passive, event.params); // 添加事件回调函数
        } else if (cur !== old) {
            old.fns = cur; // 更换原始回调函数
            on[name] = old; // 替换为封装的回掉函数
        }
    }
    for (name in oldOn) {
        if (isUndef(on[name])) {
            event = normalizeEvent(name);
            remove$$1(event.name, oldOn[name], event.capture);
        }
    }
}
```
```javascript
// 封装函数，将原始函数保存在封装函数的fns属性上。当原始函数发生变更时，只修改fns属性就可以。
function createFnInvoker (fns, vm) {
  function invoker () {
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
    }
  }
  invoker.fns = fns;
  return invoker
}
```

4.对于原生事件，在`patch`过程中会调用`updateDOMListeners`创建或者更新事件。Vue 提供了 `createOnceHandler$1`、`add$1`、`remove$2`创建和销毁原生事件的方法。在创建和销毁之前缓存当前节点对应的 DOM 元素（`target$1 = vnode.elm`）。

> 对于组件标签上的原生事件，会默认添加到组件内原生根标签 DOM 上，组件标签节点的 `elm` 指向的也是组件内原生根标签 DOM。

```javascript
var target$1;
// 添加一次性原生事件
function createOnceHandler$1(event, handler, capture) {
    var _target = target$1; // save current target element in closure
    return function onceHandler() {
        var res = handler.apply(null, arguments);
        if (res !== null) {
            remove$2(event, onceHandler, capture, _target);
        }
    };
}
// 添加事件到原生DOM上
function add$1(name, handler, capture, passive) {
    if (useMicrotaskFix) {
        var attachedTimestamp = currentFlushTimestamp;
        var original = handler;
        handler = original._wrapper = function (e) {
            if (e.target === e.currentTarget || e.timeStamp >= attachedTimestamp || e.timeStamp <= 0 || e.target.ownerDocument !== document) {
                return original.apply(this, arguments);
            }
        };
    }
    target$1.addEventListener(name, handler, supportsPassive ? { capture: capture, passive: passive } : capture);
}
// 移除原生DOM上的事件
function remove$2(name, handler, capture, _target) {
    (_target || target$1).removeEventListener(name, handler._wrapper || handler, capture);
}
```

```javascript

// 更新原生事件
function updateDOMListeners (oldVnode, vnode) {
    ...
  var on = vnode.data.on || {};// 新标签上的原生事件
  var oldOn = oldVnode.data.on || {};// 就标签上的原生事件
  target$1 = vnode.elm;// 标签对应的DOM元素
  normalizeEvents(on);
  updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
  target$1 = undefined;
}
```
