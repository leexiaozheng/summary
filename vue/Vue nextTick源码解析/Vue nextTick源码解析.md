1.`nextTick`执行时，会将回调函数添加到数组中。当没有微任务(microtask)时，即`panding`为`false`,则通过调用`timerFunc`创建微任务。微任务会在宏任务（task）完成之后执行(解释为什么更改数据之后不会立即更新页面)。微任务中会调用`flushCallbacks`，设置`pending`为`true`，表示微任务正在执行，下次`nextTick`需要重新创建微任务，然后依次执行之前收集的回调函数。

```javascript
var callbacks = [];// 微任务中将会调用的方法集合
var pending = false;// 是否创建了微任务
var timerFunc;// 创建微任务的函数
```
```javascript
function nextTick (cb, ctx) {
  var _resolve;
  callbacks.push(function () {// 将回到函数添加到数组中，将会在微任务中执行
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
  if (!pending) {// 无微任务
    pending = true;
    timerFunc();// 创建微任务
  }
  ...
}
```
```javascript
var p = Promise.resolve();
timerFunc = function () {
    p.then(flushCallbacks);// 创建微任务，微任务中调用之前收集的回调函数
};
```
```javascript
function flushCallbacks () {
  pending = false;// 微任务已被执行
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();// 依次执行回调函数
  }
}
```

2.更新页面的回调函数也会在微任务中执行。数据发生变化，通知观察者更新，观察者接收到通知后并不会立即更新（`lazy`和`sync`默认为`false`，表示既不是懒执行也不是同步执行），而是调用`queueWatcher`将观察者（`Watcher`实例）添加到单独的数组（`queue`）中。`flushSchedulerQueue`函数会依次调用数组中观察者的更新方法，`flushSchedulerQueue`函数会通过`nextTick`添加到微任务执行的数组中，之后会在微任务中被调用。观察者添加到数组时，通过`flushing`判断数组中观察者的更新方法是否已经开始执行，如果未执行（`flushing = false`）就直接添加到数组中，否则将当前观察者添加到正在执行的观察者的后面，且要当前观察者的`id`正好大于前面观察者的`id`。所以当前观察者也会在本次微任务中执行。

```javascript
// 观察者的update函数
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);// 异步执行，在下一个微任务中执行
  }
};
```

```javascript
ar MAX_UPDATE_COUNT = 100;
var queue = [];// 微任务中将会执行更新操作的watcher集合
var activatedChildren = [];
var has = {};// 标识尚未执行的watcher,如果已经执行就可以继续添加
var circular = {};
var waiting = false;// 是否将内部执行watcher更新方法的函数（flushSchedulerQueue）添加到nextTick的微任务中
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
3.`flushSchedulerQueue`函数会添加到微任务的数组中，并在微任务执行时被调用。调用过程中，先设置`flushing = true`，表示已经开始执行收集的观察者更新方法，然后将观察者根据id从小到大进行排序，再执行更新方法（`watcher.run`），保证先执行父级观察者的更新方法，再调用子级观察者的更新方法。执行完所有的更新方法后，清空数组，并且设置`waiting`和`flushing`为`false`，分别表示下一次需要重新添加`flushSchedulerQueue`到微任务执行的数组中和当前未处于执行更新方法的状态（可以直接添加观察者到数组中）。最后执行观察者的`updated`、`activated`生命周期函数。

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
    watcher.run();// 执行观察者的更新方法
    ...
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();
  /* 
    开始接收下一轮的观察者。
  */
  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);
    ...
}
```
```javascript
/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0; // 清除数组
  has = {};
  if (process.env.NODE_ENV !== 'production') {
    circular = {};
  }
  waiting = flushing = false;// 更新标识，下一次需要重新添加`flushSchedulerQueue`到微任务执行的数组中，当前未处于执行更新方法的状态（可以直接添加观察者到数组中）
}
```
4.可以调用组件`$nextTick`方法执行`nextTick`函数，回调函数将在微任务中执行。

```javascript
Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };
```

5.参考文档

- (微任务)[https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide]