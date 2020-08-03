1. 通过 Vue.use 方法调用 Vuex 中 install 安装 Vuex。然后创建 Vuex.Store 实例，并将实例添加根组件选项中。

```javascript
Vue.use(Vuex);

const store = new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
});

root = new Vue({
  el: "#app",
  store,
  template: "<App />",
  components: { App },
});
```

2. 安装 Vuex 作用是在组件 beforeCreate 生命周期中调用 vuexInit 方法，vuexInit 方法会将根组件中的 Store 实例绑定到每个组件实例上。可以通过 this.\$store 获取 store 组件实例。

```javascript
function install (_Vue) {
  if (Vue && _Vue === Vue) {// 避免重复安装
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[vuex] already installed. Vue.use(Vuex) should be called only once.'
      );
    }
    return
  }
  Vue = _Vue;// 缓存Vue到当前模块
  applyMixin(Vue);// 混入vuex
}

function applyMixin (Vue) { // 添加vuexInit方法到vue生命周期中beforeCreate
  var version = Number(Vue.version.split('.')[0]);// 获取版本号

  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit });// 混入到组件的生命周期中（全局混入）
  } else {
    // override init and inject vuex init procedure
    // for 1.x backwards compatibility.
    var _init = Vue.prototype._init;
    Vue.prototype._init = function (options) {
      if ( options === void 0 ) options = {};

      options.init = options.init
        ? [vuexInit].concat(options.init)
        : vuexInit;
      _init.call(this, options);
    };
  }

  function vuexInit () { // 将Vuex.Store实例添加到组件实例上（每个组件都会在beforeCreate中执行）
    var options = this.$options;
    // store injection
    if (options.store) {// 根组件，前提是Store实例添加到根组件实例上
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store;
    } else if (options.parent && options.parent.$store) {// 将Vuex.Store实例添加到子组件实例上
      this.$store = options.parent.$store;
    }
  }
```

3. installModule;resetStoreVM;

```javascript
var Store = function Store(options) {
  ...
  var plugins = options.plugins;
  if (plugins === void 0) plugins = [];
  var strict = options.strict;
  if (strict === void 0) strict = false;

  // store internal state
  this._committing = false;
  this._actions = Object.create(null); // 缓存actions
  this._actionSubscribers = []; // 缓存监听action事件
  this._mutations = Object.create(null); // 缓存mutation
  this._wrappedGetters = Object.create(null); // 缓存getter
  this._modules = new ModuleCollection(options); // 创建ModuleCollection实例，并将模块形成树形结构，节点为Module实例，将根模块实例保存在root属性上。
  this._modulesNamespaceMap = Object.create(null); // 存放module实例
  this._subscribers = []; // 缓存监听mutation事件
  this._watcherVM = new Vue(); // 提供vue.prototype.$watch方法
  this._makeLocalGettersCache = Object.create(null); // 按照命名空间缓存getters对象

  // bind commit and dispatch to self
  var store = this;
  var ref = this;
  var dispatch = ref.dispatch;
  var commit = ref.commit;
  this.dispatch = function boundDispatch(type, payload) {
    // 在store实例上添加dispatch方法
    return dispatch.call(store, type, payload);
  };
  this.commit = function boundCommit(type, payload, options) {
    // 在store实例上添加commit方法
    return commit.call(store, type, payload, options);
  };

  // strict mode
  this.strict = strict;

  var state = this._modules.root.state;

  // init root module.
  // this also recursively registers all sub-modules
  // and collects all module getters inside this._wrappedGetters
  installModule(this, state, [], this._modules.root);// 安装模块

  // initialize the store vm, which is responsible for the reactivity
  // (also registers _wrappedGetters as computed properties)
  resetStoreVM(this, state); // 设置响应式
  ...
};
```
4. installModule安装模块；将子模块state添加到父模块state上，属性名为模块名；封装mutation，action，getter，绑定对应的模块参数，并通过命名空间和名称绑定到store上。然后递归模块，完成子模块的安装。

```javascript
function installModule (store, rootState, path, module, hot) {
  var isRoot = !path.length;
  var namespace = store._modules.getNamespace(path);// 返回字符串父子模块以“/”分割，根模块返回空字符串

  // register in namespace map
  if (module.namespaced) {
    if (store._modulesNamespaceMap[namespace] && process.env.NODE_ENV !== 'production') {
      console.error(("[vuex] duplicate namespace " + namespace + " for the namespaced module " + (path.join('/'))));
    }
    store._modulesNamespaceMap[namespace] = module;// 缓存非根模块且带有命名空间的模块映射
  }

  // set state
  if (!isRoot && !hot) {
    var parentState = getNestedState(rootState, path.slice(0, -1));
    var moduleName = path[path.length - 1];
    store._withCommit(function () {
      if (process.env.NODE_ENV !== 'production') {
        if (moduleName in parentState) { // 父模块state中不能出现和子模块名相同的属性
          console.warn(
            ("[vuex] state field \"" + moduleName + "\" was overridden by a module with the same name at \"" + (path.join('.')) + "\"")
          );
        }
      }
      Vue.set(parentState, moduleName, module.state);// 以将子模块state添加到付模块state上，属性名为模块名
    });
  }

  var local = module.context = makeLocalContext(store, namespace, path);// 返回对象，包含dispatch、commit，state，getter,并保存在module属性上。

  module.forEachMutation(function (mutation, key) {
    var namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);// 将原生mutaions作为回调，绑定参数,只有自身模块的state，绑定在store上
  });

  module.forEachAction(function (action, key) {
    var type = action.root ? key : namespace + key;
    var handler = action.handler || action;
    registerAction(store, type, handler, local);// 将原生action作为回调，绑定参数,包含根模块数据和方法，保证action返回promise，绑定在store上
  });

  module.forEachGetter(function (getter, key) {
    var namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);// 将原生rawGetter作为回调，绑定参数,包含根模块state和getter，绑定在store上
  });

  module.forEachChild(function (child, key) {// 递归安装子模块
    installModule(store, rootState, path.concat(key), child, hot);
  });
}
```

5. resetStoreVM。利用Vue响应式以及computed属性实现vuex的state响应式和getter功能。在store严格模式下，当不通过commit修改state值时，输出警告提示。

> 定义store.getters对象属性的get方法，代理访问存在store._vm组件实例上数据。

```javascript
function resetStoreVM (store, state, hot) {
  var oldVm = store._vm;

  // bind store public getters
  store.getters = {};
  // reset local getters cache
  store._makeLocalGettersCache = Object.create(null);
  var wrappedGetters = store._wrappedGetters;
  var computed = {};
  forEachValue(wrappedGetters, function (fn, key) {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure environment.
    computed[key] = partial(fn, store);// 封装fn，将store作为fn参数
    Object.defineProperty(store.getters, key, {// 将getter代理到store.getter上，实际是从store._vm获取值
      get: function () { return store._vm[key]; },
      enumerable: true // for local getters
    });
  });

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  var silent = Vue.config.silent;
  Vue.config.silent = true;
  store._vm = new Vue({// 利用vue实现data和getter的响应式，将state和getter绑定到store._vm上
    data: {
      $$state: state
    },
    computed: computed
  });
  Vue.config.silent = silent;

  // enable strict mode for new vm
  if (store.strict) {
    enableStrictMode(store);// 当不通过mutate修改值时提示错误，通过vue.$watch方法创建watcher，当值发生变化时通知提示(store._committing为true时不提示)
  }

  if (oldVm) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(function () {
        oldVm._data.$$state = null;
      });
    }
    Vue.nextTick(function () { return oldVm.$destroy(); });
  }
}
```

6. vuex提供了mapState，mapMutation,mapGetters,mapActions方法。

7. mapState将会返回一个对象，对象的属性值对应一个方法，在方法中读取state和getters，并在调用后返回对应的值。

```javascript
var mapState = normalizeNamespace(function (namespace, states) {
  var res = {};
  if (process.env.NODE_ENV !== 'production' && !isValidMap(states)) {
    console.error('[vuex] mapState: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(states).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;

    res[key] = function mappedState () {
      var state = this.$store.state;
      var getters = this.$store.getters;
      if (namespace) {
        var module = getModuleByNamespace(this.$store, 'mapState', namespace);
        if (!module) {
          return
        }
        state = module.context.state;
        getters = module.context.getters;
      }
      return typeof val === 'function'
        ? val.call(this, state, getters)
        : state[val]
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res
});
```

8. mapGetters与state类似，对象方法返回对应getters值。

```javascript
var mapGetters = normalizeNamespace(function (namespace, getters) {
  var res = {};
  if (process.env.NODE_ENV !== 'production' && !isValidMap(getters)) {
    console.error('[vuex] mapGetters: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(getters).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;

    // The namespace has been mutated by normalizeNamespace
    val = namespace + val;
    res[key] = function mappedGetter () {
      if (namespace && !getModuleByNamespace(this.$store, 'mapGetters', namespace)) {
        return
      }
      if (process.env.NODE_ENV !== 'production' && !(val in this.$store.getters)) {
        console.error(("[vuex] unknown getter: " + val));
        return
      }
      return this.$store.getters[val]
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res
});
```

9. mapMutations返回对象，对象的属性值对应一个方法，调用该方法时执行对应模块的commit（commit绑定了对模块的参数）方法。

```javascript
var mapMutations = normalizeNamespace(function (namespace, mutations) {
  var res = {};
  if (process.env.NODE_ENV !== 'production' && !isValidMap(mutations)) {
    console.error('[vuex] mapMutations: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(mutations).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;

    res[key] = function mappedMutation () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // Get the commit method from store
      var commit = this.$store.commit;
      if (namespace) {
        var module = getModuleByNamespace(this.$store, 'mapMutations', namespace);
        if (!module) {
          return
        }
        commit = module.context.commit;
      }
      return typeof val === 'function'
        ? val.apply(this, [commit].concat(args))
        : commit.apply(this.$store, [val].concat(args))
    };
  });
  return res
});
```

10. mapAction与mapMutations类似，返回对象，对象属性值方法调用时，执行模块的dispatch方法并返回。

```javascript
var mapActions = normalizeNamespace(function (namespace, actions) {
  var res = {};
  if (process.env.NODE_ENV !== 'production' && !isValidMap(actions)) {
    console.error('[vuex] mapActions: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(actions).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;// 被映射的action方法名（重命名调用），也可能是函数，第一个参数为dispatch方法，第二个参数是调用时传入的其他参数，可以实现在同一个方法中调用不同的action

    res[key] = function mappedAction () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // get dispatch function from store
      var dispatch = this.$store.dispatch;
      if (namespace) {
        var module = getModuleByNamespace(this.$store, 'mapActions', namespace);
        if (!module) {
          return
        }
        dispatch = module.context.dispatch;
      }
      return typeof val === 'function'
        ? val.apply(this, [dispatch].concat(args))
        : dispatch.apply(this.$store, [val].concat(args))
    };
  });
  return res
});
```

11. Store提供subscribe监听state值的变化，监听事件保存在实例_subscribers变量上，当调用了commit更改state时，依次调用监听事件。action订阅实现和state订阅类似。