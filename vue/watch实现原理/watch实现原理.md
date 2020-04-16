1. 每个watch属性会创建观察者（Watcher实例）,根据属性名(例如`person.name`)生成获取属性值的方法并保存在观察者的getter变量上，属性值变化后的调用函数也会被保存在观察者的cb变量上。观察者初始化时调用getter函数，读取watch监听的数据（响应式数据），通过数据属性定义的get将观察者添加到值的依赖收集器中。

```javascript
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options,
  isRenderWatcher
) {
  this.vm = vm;
  ...
  this.cb = cb;
  ...
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);// 根据属性名生成获取属性值的方法
    ...
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};
```

```javascript
// 解析属性名
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.');
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) { return }
      obj = obj[segments[i]];
    }
    return obj
  }
}
```

2. 当监听值发生变化时，将调用收集的watch观察者的更新方法，执行`queueWatcher(this)`，将观察者添加到队列（微任务）中，在`nextTick`中执行观察者的cb方法（watch属性值变化后的调用函数）。

```javascript
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);//
  }
};
```

```javascript
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {// 处于收集watcher状态，未执行watcher方法
      queue.push(watcher);// 将
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