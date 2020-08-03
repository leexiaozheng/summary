### 安装

1. 添加全局的 beforeCreate、destroyed 生命周期事件；添加 Vue 类属性$route,$router；注册 router-view 和 router-link 组件；添加新的生命周期 beforeRouteEnter、beforeRouteLeave、beforeRouteUpdate；

2. beforeCreate 周期中，将 VueRouter 实例保存到每个组件实例上。包含 VueRouter 实例的根组件 beforeCreate 周期函数中，调用 VueRouter 实例初始化方法，并设置根组件\_route 属性响应式。

```javascript
function install(Vue) {
  if (install.installed && _Vue === Vue) {
    return;
  }
  install.installed = true;

  _Vue = Vue;

  var isDef = function (v) {
    return v !== undefined;
  };

  var registerInstance = function (vm, callVal) {
    var i = vm.$options._parentVnode; //组件标签节点
    if (
      isDef(i) &&
      isDef((i = i.data)) &&
      isDef((i = i.registerRouteInstance))
    ) {
      i(vm, callVal);
    }
  };

  Vue.mixin({
    beforeCreate: function beforeCreate() {
      if (isDef(this.$options.router)) {
        this._routerRoot = this;
        this._router = this.$options.router;
        this._router.init(this);
        Vue.util.defineReactive(this, "_route", this._router.history.current);
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
      }
      registerInstance(this, this);
    },
    destroyed: function destroyed() {
      registerInstance(this);
    },
  });

  Object.defineProperty(Vue.prototype, "$router", {
    get: function get() {
      return this._routerRoot._router;
    },
  });

  Object.defineProperty(Vue.prototype, "$route", {
    get: function get() {
      return this._routerRoot._route;
    },
  });

  Vue.component("RouterView", View);
  Vue.component("RouterLink", Link);

  var strats = Vue.config.optionMergeStrategies;
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate =
    strats.created;
}
```

### router 实例

```javascript
var VueRouter = function VueRouter(options) {
  if (options === void 0) options = {};

  this.app = null;
  this.apps = [];
  this.options = options;
  this.beforeHooks = [];
  this.resolveHooks = [];
  this.afterHooks = [];
  this.matcher = createMatcher(options.routes || [], this);

  var mode = options.mode || "hash";
  this.fallback =
    mode === "history" && !supportsPushState && options.fallback !== false;
  if (this.fallback) {
    mode = "hash";
  }
  if (!inBrowser) {
    mode = "abstract";
  }
  this.mode = mode;

  switch (mode) {
    case "history":
      this.history = new HTML5History(this, options.base);
      break;
    case "hash":
      this.history = new HashHistory(this, options.base, this.fallback);
      break;
    case "abstract":
      this.history = new AbstractHistory(this, options.base);
      break;
    default:
      if (process.env.NODE_ENV !== "production") {
        assert(false, "invalid mode: " + mode);
      }
  }
};
```

### 初始化

1. VueRouter 实例初始化方法中，调用 transitionTo方法，初始路由和页面url不匹配时，通过match找到页面url对应的路由信息。

```javascript
VueRouter.prototype.init = function init(app /* Vue component instance */) {
  // 每个组件初始化路由
  var this$1 = this;

  assert(
    install.installed,
    "not installed. Make sure to call `Vue.use(VueRouter)` " +
      "before creating root instance."
  );

  this.apps.push(app);

  // set up app destroyed handler
  // https://github.com/vuejs/vue-router/issues/2639
  app.$once("hook:destroyed", function () {
    // clean out app from this.apps array once destroyed
    var index = this$1.apps.indexOf(app);
    if (index > -1) {
      this$1.apps.splice(index, 1);
    } // 组件销毁时从apps移除
    // ensure we still have a main app or null if no apps
    // we do not release the router so it can be reused
    if (this$1.app === app) {
      this$1.app = this$1.apps[0] || null;
    }

    if (!this$1.app) {
      // clean up event listeners
      // https://github.com/vuejs/vue-router/issues/2341
      this$1.history.teardownListeners();
    }
  });

  // main app previously initialized
  // return as we don't need to set up new history listener
  if (this.app) {
    return;
  }

  this.app = app;

  var history = this.history;

  if (history instanceof HTML5History || history instanceof HashHistory) {
    var setupListeners = function () {
      history.setupListeners();
    };
    history.transitionTo(
      history.getCurrentLocation(),
      setupListeners,
      setupListeners
    );
  }

  history.listen(function (route) {
    this$1.apps.forEach(function (app) {
      app._route = route;
    });
  });
};

// 创建页面初始路由
var START = createRoute(null, {
  path: "/",
});
```

### RouterView

```javascript
var View = {
  name: "RouterView",
  functional: true,
  props: {
    name: {
      type: String,
      default: "default",
    },
  },
  render: function render(_, ref) {
    var props = ref.props;
    var children = ref.children;
    var parent = ref.parent;
    var data = ref.data;

    // used by devtools to display a router-view badge
    data.routerView = true;

    // directly use parent context's createElement() function
    // so that components rendered by router-view can resolve named slots
    var h = parent.$createElement;
    var name = props.name;
    var route = parent.$route;
    var cache = parent._routerViewCache || (parent._routerViewCache = {});

    // determine current view depth, also check to see if the tree
    // has been toggled inactive but kept-alive.
    var depth = 0;
    var inactive = false;
    while (parent && parent._routerRoot !== parent) {
      var vnodeData = parent.$vnode ? parent.$vnode.data : {};
      if (vnodeData.routerView) {
        depth++;
      }
      if (vnodeData.keepAlive && parent._directInactive && parent._inactive) {
        inactive = true;
      }
      parent = parent.$parent;
    }
    data.routerViewDepth = depth;

    // render previous view if the tree is inactive and kept-alive
    if (inactive) {
      var cachedData = cache[name];
      var cachedComponent = cachedData && cachedData.component;
      if (cachedComponent) {
        // #2301
        // pass props
        if (cachedData.configProps) {
          fillPropsinData(
            cachedComponent,
            data,
            cachedData.route,
            cachedData.configProps
          );
        }
        return h(cachedComponent, data, children);
      } else {
        // render previous empty view
        return h();
      }
    }

    var matched = route.matched[depth];
    var component = matched && matched.components[name];

    // render empty node if no matched route or no config component
    if (!matched || !component) {
      cache[name] = null;
      return h();
    }

    // cache component
    cache[name] = { component: component };

    // attach instance registration hook
    // this will be called in the instance's injected lifecycle hooks
    data.registerRouteInstance = function (vm, val) {
      // val could be undefined for unregistration
      var current = matched.instances[name];
      if ((val && current !== vm) || (!val && current === vm)) {
        matched.instances[name] = val;
      }
    };

    // also register instance in prepatch hook
    // in case the same component instance is reused across different routes
    (data.hook || (data.hook = {})).prepatch = function (_, vnode) {
      matched.instances[name] = vnode.componentInstance;
    };

    // register instance in init hook
    // in case kept-alive component be actived when routes changed
    data.hook.init = function (vnode) {
      if (
        vnode.data.keepAlive &&
        vnode.componentInstance &&
        vnode.componentInstance !== matched.instances[name]
      ) {
        matched.instances[name] = vnode.componentInstance;
      }
    };

    var configProps = matched.props && matched.props[name];
    // save route and configProps in cachce
    if (configProps) {
      extend(cache[name], {
        route: route,
        configProps: configProps,
      });
      fillPropsinData(component, data, route, configProps);
    }

    return h(component, data, children);
  },
};
```

### 页面跳转

```javascript
HTML5History.prototype.go = function go(n) {
  // 路由回退或者前进
  window.history.go(n);
};

HTML5History.prototype.push = function push(location, onComplete, onAbort) {
  // 路由跳转
  var this$1 = this;

  var ref = this;
  var fromRoute = ref.current;
  this.transitionTo(
    location,
    function (route) {
      pushState(cleanPath(this$1.base + route.fullPath)); // 保存页面滚动信息，设置页面跳转url，添加一条记录到history中
      handleScroll(this$1.router, route, fromRoute, false);
      onComplete && onComplete(route);
    },
    onAbort
  );
};

HTML5History.prototype.replace = function replace(
  location,
  onComplete,
  onAbort
) {
  var this$1 = this;

  var ref = this;
  var fromRoute = ref.current;
  this.transitionTo(
    location,
    function (route) {
      replaceState(cleanPath(this$1.base + route.fullPath)); // 保存页面滚动信息，修改当前路由，并修改history当前记录
      handleScroll(this$1.router, route, fromRoute, false); // 页面滚动
      onComplete && onComplete(route); // 跳转成功回调函数
    },
    onAbort
  );
};
```

4.

```javascript
History.prototype.transitionTo = function transitionTo(
  location, // 路径，或者包含路径名称的对象
  onComplete,
  onAbort
) {
  var this$1 = this;

  var route = this.router.match(location, this.current); // 当前路由信息
  this.confirmTransition(
    route,
    function () {
      var prev = this$1.current;
      this$1.updateRoute(route);
      onComplete && onComplete(route);
      this$1.ensureURL();
      this$1.router.afterHooks.forEach(function (hook) {
        hook && hook(route, prev);
      });

      // fire ready cbs once
      if (!this$1.ready) {
        this$1.ready = true;
        this$1.readyCbs.forEach(function (cb) {
          cb(route);
        });
      }
    },
    function (err) {
      if (onAbort) {
        onAbort(err);
      }
      if (err && !this$1.ready) {
        this$1.ready = true;
        this$1.readyErrorCbs.forEach(function (cb) {
          cb(err);
        });
      }
    }
  );
};
```

```javascript
VueRouter.prototype.match = function match(raw, current, redirectedFrom) {
  return this.matcher.match(raw, current, redirectedFrom);
};
```

```javascript
function match(raw, currentRoute, redirectedFrom) {
  // 根据用户传参匹配路由信息
  var location = normalizeLocation(raw, currentRoute, false, router); // 格式化用户参数
  var name = location.name;

  if (name) {
    var record = nameMap[name];
    {
      warn(record, "Route with name '" + name + "' does not exist");
    }
    if (!record) {
      return _createRoute(null, location);
    }
    var paramNames = record.regex.keys
      .filter(function (key) {
        return !key.optional;
      })
      .map(function (key) {
        return key.name;
      });

    if (typeof location.params !== "object") {
      location.params = {};
    }

    if (currentRoute && typeof currentRoute.params === "object") {
      for (var key in currentRoute.params) {
        if (!(key in location.params) && paramNames.indexOf(key) > -1) {
          location.params[key] = currentRoute.params[key];
        }
      }
    }

    location.path = fillParams(
      record.path,
      location.params,
      'named route "' + name + '"'
    );
    return _createRoute(record, location, redirectedFrom);
  } else if (location.path) {
    location.params = {};
    for (var i = 0; i < pathList.length; i++) {
      var path = pathList[i];
      var record$1 = pathMap[path];
      if (matchRoute(record$1.regex, location.path, location.params)) {
        return _createRoute(record$1, location, redirectedFrom);
      }
    }
  }
  // no match
  return _createRoute(null, location);
}
```
