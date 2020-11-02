### 安装

1. 添加全局的 beforeCreate、destroyed 生命周期方法；Vue.prototype 上添加`$route`和`$router` 属性；注册 router-view 和 router-link 组件；添加新的生命周期 beforeRouteEnter、beforeRouteLeave、beforeRouteUpdate；

2. beforeCreate 周期中，将路由 VueRouter 实例 router 添加根组件（包含 VueRouter 实例选项的组件）上，同时添加路由信息\_route 属性到根组件上，设置该属性响应式。子组件\_routerRoot 属性指向该根组件。

3. Vue.prototy 上的`$router`和`$route` 属性值也是来自于根组件的 router 和\_route。

> 根组件的 beforeCreate 周期中调用了 VueRouter 实例的 init 方法进行初始化。

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
                Vue.util.defineReactive(
                    this,
                    "_route",
                    this._router.history.current
                );
            } else {
                this._routerRoot =
                    (this.$parent && this.$parent._routerRoot) || this;
            }
            registerInstance(this, this);
        },
        destroyed: function destroyed() {
            registerInstance(this);
        },
    });

    Object.defineProperty(Vue.prototype, "$router", {
        get: function get() {
            return this._routerRoot._router; // this._routerRoot 根组件
        },
    });

    Object.defineProperty(Vue.prototype, "$route", {
        get: function get() {
            return this._routerRoot._route; // this._routerRoot 根组件
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

1. VueRouter 构造器中，根据配置的路由模式生成对应的 History 实例。

> 调用了 createMatcher 方法，根据选项中的路由生成路径、名称和路由配置项的映射，并返回 matcher，提供 match 和 addRoutes 方法。

2. 根据路由模式配置，生成对应的 History 实例。

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

### RouterView 组件

1. props 的 name 属性匹配对应的路由命名视图。

2. 调用 render 函数，渲染当前路由对应的组件。通过 `parent.$route` 读取当前的路由信息,然后向上查找，根据 routerView 路由组件标识 routerView，获取当前的路由层级。根据路由层级和命名视图的名称获取对应的组件选项，根据组件选项生成对应的节点（VNode 实例）返回。

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
        var route = parent.$route; // 读取路由信息
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
            if (
                vnodeData.keepAlive &&
                parent._directInactive &&
                parent._inactive
            ) {
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

        var matched = route.matched[depth]; // 获取当前层级的组件
        var component = matched && matched.components[name]; // 获取该层级下命名视图对应的组件

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

> route.matched 依次保存了当前路径对应的组件选项，以下面路由配置为例：`/home/tab/list`路径对应的 matched 是:`[Home, Tab, List]`。

```javascript
const router = new Router({
    mode: "history",
    routes: [
        {
            name: "home",
            path: "/home",
            component: Home,
            children: [
                {
                    name: "tab",
                    path: "tab",
                    component: Tab,
                    children: [
                        {
                            name: "list",
                            path: "list",
                            component: List,
                        },
                    ],
                },
            ],
        },
    ],
});
```

### 实例 init 初始化

1. 根组件的 beforeCreate 周期中调用了 VueRouter 实例 init 方法。默认初始路径为“/”，并根据该路径获取对应的路由信息，然后和当前真实的 url 路径比对，更新为当前 url 对应的路由信息，更改\_router 值，由于设置了\_router 属性响应式，且 router-view 读取了该值，当\_router 重新赋值时，就有重新渲染 router-view 组件，加载当前路径对应的组件页面。

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
            app._route = route; // 更新路由
        });
    });
};

// 初始路由信息
var START = createRoute(null, {
    path: "/",
});
```

### 路由跳转

1.  HTML5History，HashHistory，AbstractHistory 继承了 Histroy，Histroy 实例上的 router 指向 VueRouter 实例。Histroy 提供了 transitionTo 和 confirmTransition 方法，将在路由跳转时调用。

```javascript
/*  */
var History = function History (router, base) {
    this.router = router;// VueRouter实例
    this.base = normalizeBase(base);// 格式化基础路径
    // start with a route object that stands for "nowhere"
    this.current = START;// "/"对应的路由信息(初始路由信息)
    this.pending = null;
    this.ready = false;
    this.readyCbs = [];
    this.readyErrorCbs = [];
    this.errorCbs = [];
    this.listeners = [];
  };

  History.prototype.transitionTo = function transitionTo (
    location,// 当前URL对应路由的路径
    onComplete,
    onAbort
  ) {
      var this$1 = this;

    var route = this.router.match(location, this.current);// 调用VueRouter实例的match方法，返回即将跳转的路由信息，current当前的路由信息
    this.confirmTransition(
      route,
      function () {
        var prev = this$1.current;
        this$1.updateRoute(route);// 更新为跳转后的路由信息
      },
      ...
    );
  };

  History.prototype.confirmTransition = function confirmTransition (route, onComplete, onAbort) {
      ...
  };

  History.prototype.updateRoute = function updateRoute (route) {
    this.current = route;
    this.cb && this.cb(route);
  };

  History.prototype.setupListeners = function setupListeners () {
    ...
  };

  History.prototype.teardownListeners = function teardownListeners () {// 清除事件监听
    ...
  };


var HTML5History = /*@__PURE__*/ (function (History) {
  //继承了History
  function HTML5History(router, base) {
    History.call(this, router, base);

    this._startLocation = getLocation(this.base);
  }

  if (History) HTML5History.__proto__ = History; // 继承History，复用构造器上的方法
  HTML5History.prototype = Object.create(History && History.prototype); // 继承History，复用实例上的方法
  HTML5History.prototype.constructor = HTML5History;// 继承History，复用构造器

  HTML5History.prototype.setupListeners = function setupListeners() {
    var this$1 = this;

    if (this.listeners.length > 0) {
      return;
    }

    var router = this.router;
    var expectScroll = router.options.scrollBehavior;
    var supportsScroll = supportsPushState && expectScroll;

    if (supportsScroll) {
      this.listeners.push(setupScroll()); //添加事件
    }

    var handleRoutingEvent = function () {
      var current = this$1.current;

      // Avoiding first `popstate` event dispatched in some browsers but first
      // history route not updated since async guard at the same time.
      var location = getLocation(this$1.base);
      if (this$1.current === START && location === this$1._startLocation) {
        return;
      }

      this$1.transitionTo(location, function (route) {
        if (supportsScroll) {
          handleScroll(router, route, current, true);
        }
      });
    };
    window.addEventListener("popstate", handleRoutingEvent);
    this.listeners.push(function () {
      window.removeEventListener("popstate", handleRoutingEvent);
    });
  };

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
  /**
   *  获取路由路径（不包含基础路径）
   */
  HTML5History.prototype.getCurrentLocation = function getCurrentLocation() {
    return getLocation(this.base);
  };

  return HTML5History;
})(History);
```

### 页面跳转

1. 路由跳转时先根据当前路由和跳转路由对应的组件，分别提取出需要更新，需要冻结（隐藏或移除），需要激活（创建或显示）的组件。然后依次调用组件上路由相关的生命周期钩子函数，包括加载异步组件。

2. 调用路由生命周期钩子函数后，更新当前的路由数据。

3. 最后更新 history 状态，并保存页面的滚动状态。

> 由于对路由数据设置了响应式，更新当前的路由数据会触发页面重新渲染

```javascript
HTML5History.prototype.push = function push(location, onComplete, onAbort) {
    // 路由跳转
    var this$1 = this;

    var ref = this;
    var fromRoute = ref.current;
    this.transitionTo(
        location, // 跳转选项
        function (route) {
            pushState(cleanPath(this$1.base + route.fullPath)); // 保存页面滚动信息，设置页面跳转url，添加一条记录到history中
            handleScroll(this$1.router, route, fromRoute, false);
            onComplete && onComplete(route);
        },
        onAbort
    );
};

History.prototype.transitionTo = function transitionTo(
    location, // 跳转选项
    onComplete,
    onAbort
) {
    var this$1 = this;

    var route = this.router.match(location, this.current); // 调用VueRouter实例的match方法，返回跳转选项匹配的路由信息
    this.confirmTransition(
        route,
        function () {
            var prev = this$1.current;
            this$1.updateRoute(route); // 更新为已经跳转的路由
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

History.prototype.confirmTransition = function confirmTransition(
    route,
    onComplete,
    onAbort
) {
    var this$1 = this;

    var current = this.current;
    var abort = function (err) {
        // changed after adding errors with
        // https://github.com/vuejs/vue-router/pull/3047 before that change,
        // redirect and aborted navigation would produce an err == null
        if (!isRouterError(err) && isError(err)) {
            if (this$1.errorCbs.length) {
                this$1.errorCbs.forEach(function (cb) {
                    cb(err);
                });
            } else {
                warn(false, "uncaught error during route navigation:");
                console.error(err);
            }
        }
        onAbort && onAbort(err);
    };
    if (
        isSameRoute(route, current) &&
        // in the case the route map has been dynamically appended to
        route.matched.length === current.matched.length
    ) {
        this.ensureURL(); // 确保当前路由和页面的url一致
        return abort(createNavigationDuplicatedError(current, route));
    }

    var ref = resolveQueue(this.current.matched, route.matched); // 比对新旧路由对应的组件嵌套信息，判断出哪些组件需要更新，哪些组件需要激活，哪些组件需要冻结
    var updated = ref.updated; // 当前路由和即将跳转路由相同部分（组件）（更新）
    var deactivated = ref.deactivated; // 当前路由不同部分（组件）（冻结）
    var activated = ref.activated; // 即将跳转路由不同部分（组件）（激活）

    var queue = [].concat(
        // in-component leave guards
        extractLeaveGuards(deactivated),
        // global before hooks
        this.router.beforeHooks,
        // in-component update hooks
        extractUpdateHooks(updated),
        // in-config enter guards
        activated.map(function (m) {
            return m.beforeEnter;
        }),
        // async components
        resolveAsyncComponents(activated) // 返回函数function(to, from, next)
    );

    this.pending = route;
    var iterator = function (hook, next) {
        if (this$1.pending !== route) {
            return abort(createNavigationCancelledError(current, route));
        }
        try {
            // 调用钩子方法
            hook(route, current, function (to) {
                if (to === false) {
                    // next(false) -> abort navigation, ensure current URL
                    this$1.ensureURL(true);
                    abort(createNavigationAbortedError(current, route));
                } else if (isError(to)) {
                    this$1.ensureURL(true);
                    abort(to);
                } else if (
                    typeof to === "string" ||
                    (typeof to === "object" &&
                        (typeof to.path === "string" ||
                            typeof to.name === "string"))
                ) {
                    // next('/') or next({ path: '/' }) -> redirect
                    abort(createNavigationRedirectedError(current, route));
                    if (typeof to === "object" && to.replace) {
                        this$1.replace(to);
                    } else {
                        this$1.push(to);
                    }
                } else {
                    // confirm transition and pass on the value
                    // 调用下一个钩子方法
                    next(to);
                }
            });
        } catch (e) {
            abort(e);
        }
    };

    runQueue(queue, iterator, function () {
        // 调用组件leave、update等钩子函数，异步获取组件选项，创建组件构造器,最后调用这里的回调函数
        var postEnterCbs = [];
        var isValid = function () {
            return this$1.current === route;
        };
        // wait until async components are resolved before
        // extracting in-component enter guards
        var enterGuards = extractEnterGuards(activated, postEnterCbs, isValid); // 异步加载组件选项中的enter钩子方法
        var queue = enterGuards.concat(this$1.router.resolveHooks);
        runQueue(queue, iterator, function () {
            if (this$1.pending !== route) {
                return abort(createNavigationCancelledError(current, route));
            }
            this$1.pending = null;
            onComplete(route); // 更新路由
            if (this$1.router.app) {
                this$1.router.app.$nextTick(function () {
                    postEnterCbs.forEach(function (cb) {
                        cb();
                    });
                });
            }
        });
    });
};
```
