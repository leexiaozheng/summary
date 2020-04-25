1.`directive`、`show`两个 Vue 自带指令通过`extend`方法保存在`Vue.options.directives`上。

```javascript
var platformDirectives = {
  model: directive,
  show: show,
};

extend(Vue.options.directives, platformDirectives);

function extend(to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to;
}
```

2.Vue 提供了`Vue.directive`方法创建全局指令，添加到`Vue.options.directives`上。

```javascript
var ASSET_TYPES = ["component", "directive", "filter"];

ASSET_TYPES.forEach(function (type) {
  Vue[type] = function (id, definition) {
    if (!definition) {
      return this.options[type + "s"][id];
    } else {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "production" && type === "component") {
        validateComponentName(id);
      }
      if (type === "component" && isPlainObject(definition)) {
        definition.name = definition.name || id;
        definition = this.options._base.extend(definition);
      }
      if (type === "directive" && typeof definition === "function") {
        definition = { bind: definition, update: definition };
      }
      this.options[type + "s"][id] = definition;
      return definition;
    }
  };
});
```

3.不仅可以全局添加指令，也可以在组件选项上添加指令，仅在组件内部生效。创建组件时，会格式化组件选项上的指令，再合并全局和组件内的指令。

```javascript
/**
 * 合并组件选项
 */
function mergeOptions (
  parent,
  child,
  vm
) {
    ...
    normalizeDirectives(child);// 格式化指令
    ...
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm);
    }
    if (child.mixins) {
      for (var i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm);
      }
    }
  }

  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);// 合并选项
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);// 合并选项
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;// 获取合并策略
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}
```

4.格式化指令，保持一致的指令定义格式。如果定义指令的属性值是函数，则将赋值给`bind`和`update`属性。

```javascript
/**
 * 格式化组件指令
 */
function normalizeDirectives(options) {
  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def$$1 = dirs[key];
      if (typeof def$$1 === "function") {
        // 值为函数类型
        dirs[key] = { bind: def$$1, update: def$$1 };
      }
    }
  }
}
```

5.全局指令和组件内指令是通过`Object.create`进行合并的，组件内指令对象的原型链指向全局的指令对象，当在组件内未找到该指令时就会去全局的指令对象内查找。

```javascript
/**
 * Object.create的合并策略
 */
function mergeAssets(parentVal, childVal, vm, key) {
  var res = Object.create(parentVal || null);
  if (childVal) {
    process.env.NODE_ENV !== "production" &&
      assertObjectType(key, childVal, vm);
    return extend(res, childVal);
  } else {
    return res;
  }
}
/**
 * 设置componet,directive,filter合并策略
 */
ASSET_TYPES.forEach(function (type) {
  strats[type + "s"] = mergeAssets;
});
```

4.标签上的指令会被编译器解析成对象。解析结果会在组件渲染时保存在节点（`VNode` 实例）上。

```html
<div v-test:name.fale="getName"></div>
```

指令解析结果：

```javascript
{
  directives: [
    {
      name: "test",
      rawName: "v-test:name.fale",
      value: getName,
      expression: "getName", // 表达式
      arg: "name", // 参数
      modifiers: { fale: true }, // 修饰符
    },
  ];
}
```

5.节点在渲染的过程（创建 `DOM` 或组件，更新节点，插入到父级 `DOM` 元素，节点销毁）中有很多钩子被调用，用来处理节点对应标签的各种数据。 这些钩子中包括了指令的`create`、`update`、`destroy`三个钩子函数，将在节点渲染的过程中被调用。

> 这里的钩子函数和指令定义时的钩子函数不相同。

```javascript
/* 指令的钩子函数 */
var emptyNode = new VNode("", {}, []);

var directives = {
  create: updateDirectives, // 创建了DOM元素后调用
  update: updateDirectives, // 更新节点时调用
  destroy: function unbindDirectives(vnode) {
    // 销毁节点时调用
    updateDirectives(vnode, emptyNode);
  },
};

function updateDirectives(oldVnode, vnode) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}
```

6.指令的三个钩子都会调用`_update`函数。

```javascript
function _update(oldVnode, vnode) {
  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  var oldDirs = normalizeDirectives$1(
    oldVnode.data.directives,
    oldVnode.context
  ); // 旧标签节点上的指令数据集合（包含标签上的指令信息和指令定义）
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context); // 新标签节点上的指令数据集合（包含标签上的指令信息和指令定义）

  var dirsWithInsert = [];
  var dirsWithPostpatch = [];

  var key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // 指令第一次绑定到元素上
      // new directive, bind
      callHook$1(dir, "bind", vnode, oldVnode); // 调用bind钩子函数
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value; // 更新指令的值
      dir.oldArg = oldDir.arg; // 更新指令的参数（指令参数可动态变化）
      callHook$1(dir, "update", vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    var callInsert = function () {
      for (var i = 0; i < dirsWithInsert.length; i++) {
        callHook$1(dirsWithInsert[i], "inserted", vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode, "insert", callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, "postpatch", function () {
      for (var i = 0; i < dirsWithPostpatch.length; i++) {
        callHook$1(dirsWithPostpatch[i], "componentUpdated", vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook$1(oldDirs[key], "unbind", oldVnode, oldVnode, isDestroy);
      }
    }
  }
}
```

7.在`_update`函数中，先调用`normalizeDirective$1`函数，根据指令名称在组件`$options.directives`查找到指令的定义，并和对应的标签指令数据保存在一起。

> 如果在组件`$options.directives`上未找到指令的定义，就会从它的原型链上查找，也就从全局指令上查找。

```javascript
var emptyModifiers = Object.create(null);

function normalizeDirectives$1(dirs, vm) {
  var res = Object.create(null);
  if (!dirs) {
    // $flow-disable-line
    return res;
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      // 没有修饰符
      // $flow-disable-line
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir; // 可能存在同名指令、但参数和修饰符不同
    dir.def = resolveAsset(vm.$options, "directives", dir.name, true); // 根据指令名称获取指令定义，并保存在标签指令数据上
  }
  // $flow-disable-line
  return res;
}
//获取原始名称（包含前缀、参数、修饰符）
function getRawDirName(dir) {
  return (
    dir.rawName || dir.name + "." + Object.keys(dir.modifiers || {}).join(".")
  );
}
```

8.当没有旧标签指令时（指令第一次绑定到元素上），调用指令定义的`bind`钩子函数，如果指令定义中还有`insert`钩子函数，就将指令数据添加到 `insert` 队列中暂存。

```javascript
/*
 * 调用指令钩子函数（格式化钩子函数参数）
 */
function callHook$1(dir, hook, vnode, oldVnode, isDestroy) {
  var fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(
        e,
        vnode.context,
        "directive " + dir.name + " " + hook + " hook"
      );
    }
  }
}
```

9.否则，即新旧标签指令都存在，就调用指令定义的`update`钩子函数，如果指令定义中还有`componentUpdated`钩子函数，就将指令数据添加到`componentUpdated`队列中暂存。

10.暂存在`insert`队列中的指令，会在节点生成的 DOM 元素插入到父级 DOM 元素后调用它定义的 `insert` 钩子函数。而暂存在`componentUpdated`队列中的指令，会在节点以及子节点更新完成后调用它定义的`componentUpdated`钩子函数。

> `mergeVNodeHook` 封装了节点默认的 `insert`、`componentUpdated` 钩子函数。默认钩子函数和指令定义的钩子函数依次添加到数组中，保存在封装函数的 `fns` 属性上，调用封装钩子函数时，将会依次调用 `fns` 数组上的钩子函数。

```javascript
function mergeVNodeHook(def, hookKey, hook) {
  if (def instanceof VNode) {
    def = def.data.hook || (def.data.hook = {}); // 节点钩子函数集合
  }
  var invoker;
  var oldHook = def[hookKey]; // 特定阶段的节点钩子函数

  function wrappedHook() {
    hook.apply(this, arguments);
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    remove(invoker.fns, wrappedHook); // 调用完指令定义的钩子函数后移除
  }

  if (isUndef(oldHook)) {
    // no existing hook
    invoker = createFnInvoker([wrappedHook]);
  } else {
    /* istanbul ignore if */
    if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
      // 已经封装过的，周期函数已经发生合并
      // already a merged invoker
      invoker = oldHook;
      invoker.fns.push(wrappedHook); // 添加新的周期函数
    } else {
      // existing plain hook
      invoker = createFnInvoker([oldHook, wrappedHook]); // 封装周期函数，在原始钩子函数执行之后，执行新增的钩子函数
    }
  }

  invoker.merged = true; // 标识周期函数发生合并
  def[hookKey] = invoker; // 更新周期函数
}
/*
 *封装函数，将原始函数保存在封装函数的fns属性上。当原始函数发生变更时，只修改fns属性就可以
 */
function createFnInvoker(fns, vm) {
  function invoker() {
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(
          cloned[i],
          null,
          arguments$1,
          vm,
          "v-on handler"
        );
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler");
    }
  }
  invoker.fns = fns;
  return invoker;
}
```
