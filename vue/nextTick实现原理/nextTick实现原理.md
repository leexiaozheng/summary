1. 

```javascript
var callbacks = [];// 微任务中将会调用的方法集合
var pending = false;// 是否创建了微任务
var timerFunc;// 创建微任务的函数
```
```javascript
function nextTick (cb, ctx) {
  var _resolve;
  callbacks.push(function () {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {// 微任务
    pending = true;
    timerFunc();// 创建微任务
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}
```
```javascript
var p = Promise.resolve();
timerFunc = function () {
    p.then(flushCallbacks);// 执行微任务，调用之前收集的方法
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) { setTimeout(noop); }
};
```
```javascript
function flushCallbacks () {
  pending = false;// 微任务已被执行
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}
```
2. 

```javascript
ar MAX_UPDATE_COUNT = 100;
var queue = [];// 微任务中将会执行更新操作的watcher集合
var activatedChildren = [];
var has = {};
var circular = {};
var waiting = false;// 是否将内部执行watcher更新方法的函数添加到nextTick的微任务中
var flushing = false;// 是否正在执行watcher的更新操作
var index = 0;// 正在执行更新方法的watcher所在队列中的索引
```

```javascript
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {// 处于收集watcher状态，未执行watcher方法
      queue.push(watcher);
    } else {// 正在执行搜集的watcher的更新方法
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) { // 插入到当前正在处理的wacher后面，且正好id要大于前面id
        i--;
      }
      queue.splice(i + 1, 0, watcher); // 根据id大小插入到未处理的watch里面
    }
    // queue the flush
    if (!waiting) {
      waiting = true;

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue();
        return
      }
      nextTick(flushSchedulerQueue);
    }
  }
}
```

```javascript
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow();
  flushing = true;
  var watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort(function (a, b) { return a.id - b.id; });// 从小到大排序

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    if (watcher.before) {
      watcher.before();
    }
    id = watcher.id;
    has[id] = null;// watcher方法已经进入执行，可以继续添加该watcher
    watcher.run();
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? ("in watcher with expression \"" + (watcher.expression) + "\"")
              : "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();
  /* 执行完所有的watcher更新方法，重置数据，
    清空队列，activatedChildren = [], queue = []
    设置状态，
    开始接收下一轮的观察者。
  */
  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }
}
```
```javascript
/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0;
  has = {};
  if (process.env.NODE_ENV !== 'production') {
    circular = {};
  }
  waiting = flushing = false;
}
```

```javascript
function callUpdatedHooks (queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated');
    }
  }
}
```
3.

```javascript
queueActivatedComponent
```
4. 
```javascript
Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };
```