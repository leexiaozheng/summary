html：

    <!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8"/>
        <title>vue渲染的整体流程</title>
    </head>
    <body>
        <div id="app"></div>
    </body>

    </html>


main.js：

    import Vue from "vue";
    import Home from "./home.vue";

    instance = new Vue({
        el: "#app",
        template: "<Home/>",
        components: { Home }
    });


home.vue

    <template>
        <div class="home">
            test
        </div>
    </template>
    <script>
    export default {
        name: "home",
        data() {
            return {
                show: false
            };
        },
        mounted() {
        },
        methods: {
        }
    };
    </script>

1. 在main.js中`new Vue()`生成根组件实例`vm`，`Vue`构造器执行`_init`方法。

    function Vue (options) {
        ...
        this._init(options);
    }

2. 在`_init`方法中，构造器参数添加到组件的`$options`上，并且执行`vm.$mount`渲染页面。


        Vue.prototype._init = function (options) {
            var vm = this;
            ...
            if (vm.$options.el) {
                vm.$mount(vm.$options.el);
            }
        };

3. 在`$mount`方法中，使用编译器将`template`生成`render`函数，并挂载在`$options`上,并继续执行`mount`方法，调用`mountComponent`。

        Vue.prototype.$mount = function (el, hydrating) {
            el = el && query(el);
            ...
            var options = this.$options;
            ...
            var ref = compileToFunctions(template, {// template html模板，将模板解析为render渲染函数
            outputSourceRange: process.env.NODE_ENV !== 'production',
            shouldDecodeNewlines: shouldDecodeNewlines,
            shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
            delimiters: options.delimiters, // 改变纯文本插入分割符
            comments: options.comments// 是否保留模板中的HTML注释
            }, this);
            var render = ref.render;
            var staticRenderFns = ref.staticRenderFns;
            options.render = render;
            options.staticRenderFns = staticRenderFns;
            ...
            return mount.call(this, el, hydrating)
        };

4. 在`mountComponent`，生成观察者`Watcher`实例，并传入声明的`updateComponent`函数，该函数执行时调用`vm._update(vm._render(), hydrating)`。在`Watcher`构造器中会调用`updateCompnent`函数，执行`vm._update(vm._render(), hydrating)`。

function mountComponent (
  vm,
  el,
  hydrating
) {
    vm.$el = el;
    ...
    updateComponent = function () {
        vm._update(vm._render(), hydrating);
    }
    ...
    new Watcher(vm, updateComponent, noop, {
        before: function before () {
        if (vm._isMounted && !vm._isDestroyed) {
            callHook(vm, 'beforeUpdate');
        }
        }
    }, true /* isRenderWatcher */);
    ...
    return vm
}

5. `vm._update(vm._render(), hydrating)`会先调用`vm._render()`，_render中会调用之前template转换成的render函数。
render函数中的_c指向是_createElement方法。

        render() {
            return _c('Home')
        }

6. _createElement中，根据绑定在$options上的构造器参数的components属性，获取Home组件对象。

        function _createElement (context, tag, data, children, normalizationType
        ) {
            if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {/* 从vm实例的option的components中寻找该tag */
                // component
                vnode = createComponent(Ctor, data, context, children, tag);
            } 
            if (Array.isArray(vnode)) {
                return vnode
            } else if (isDef(vnode)) {
                if (isDef(ns)) { applyNS(vnode, ns); }
                if (isDef(data)) { registerDeepBindings(data); }
                return vnode
            } else {
                return createEmptyVNode()
            }
        }

7. Home组件对象就是home.vue文件中默认导出的对象，当创建多个组件时，都是基于同一个组件对象。vue-loader插件会将vue格式的文件中的template转化成render函数放在组件对象中。`components: { Home }`中的Home就是home组件对象。

8. 获取到的home组件对象作为参数，传入createComponet函数中，在该函数中，调用extend方法，传入组件对象生成组件构造器，安装节点生命周期钩子，同时创建VNode实例，将组件构造器和节点生命周期钩子保存在VNode节点实例上。

        function createComponent (
        Ctor,
        data,
        context,
        children,
        tag
        ) {
            var baseCtor = context.$options._base;
            ...
            Ctor = baseCtor.extend(Ctor);
            ...
            data = data || {};
            ...
            // 安装节点生命周期
            installComponentHooks(data);
            ...
            // return a placeholder vnode
            var name = Ctor.options.name || tag;
            var vnode = new VNode(
                ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
                data, undefined, undefined, undefined, context,
                { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
                asyncFactory
            );
            return vnode
        }

VNode:

    var VNode = function VNode (
        tag,
        data,
        children,
        text,
        elm,
        context,
        componentOptions,
        asyncFactory
    ) {
        this.tag = tag;
        this.data = data;
        this.children = children;
        this.text = text;
        this.elm = elm;
        this.ns = undefined;
        this.context = context;
        this.fnContext = undefined;
        this.fnOptions = undefined;
        this.fnScopeId = undefined;
        this.key = data && data.key;
        this.componentOptions = componentOptions;
        this.componentInstance = undefined;
        this.parent = undefined;
        this.raw = false;
        this.isStatic = false;
        this.isRootInsert = true;
        this.isComment = false;
        this.isCloned = false;
        this.isOnce = false;
        this.asyncFactory = asyncFactory;
        this.asyncMeta = undefined;
        this.isAsyncPlaceholder = false;
    };

节点的生命周期钩子:

    var componentVNodeHooks = {
        init: function init (vnode, hydrating) {
            ...
            var child = vnode.componentInstance = createComponentInstanceForVnode(
                vnode,
                activeInstance
            );
            child.$mount(hydrating ? vnode.elm : undefined, hydrating);
        },
        prepatch: function prepatch (oldVnode, vnode) {
            ...
        },
        insert: function insert (vnode) {
            ...
        },
        destroy: function destroy (vnode) {
            ...
        }
    };

9. 生成的VNode实例最终通过_render方法返回并作为参数传入到_update方法中,_update方法中调用_patch__方法，根据VNode实例渲染成dom元素并返回赋值给vm.$el（组件根标签）。

    Vue.prototype._update = function (vnode, hydrating) {
        var vm = this;
        ...
        var restoreActiveInstance = setActiveInstance(vm);
        ...
        vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
        ...
        restoreActiveInstance();
        ...
    };

10. __patch__方法调用的是patch函数，函数中依次调用createEle -> createComponent 方法，在createComponent方法中，会调用绑定在VNode组件实例上的节点生命周期钩子函数init，该生命周期钩子函数init也会根据绑定在VNode上的组件构造器生成组件实例。调用组件构造器，执行构造器中的_init方法，执行过程中，生成组件DOM，并将组件根元素保存节点实例的elm属性上，并将elm元素添加到父元素（body）上，完成整个DOM的渲染。

    function patch (oldVnode, vnode, hydrating, removeOnly) {
        ...
        var insertedVnodeQueue = [];
        ...
        // replacing existing element
        var oldElm = oldVnode.elm;
        var parentElm = nodeOps.parentNode(oldElm);// 获取父元素

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)// 获取紧跟的弟弟元素
        );
        return vnode.elm
    }

    function createElm (
        vnode,
        insertedVnodeQueue,
        parentElm,
        refElm,
        nested,
        ownerArray,
        index
    ) {
        createComponent(vnode, insertedVnodeQueue, parentElm, refElm)
    }

    function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
        var i = vnode.data;
        if (isDef(i)) {
        var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
        if (isDef(i = i.hook) && isDef(i = i.init)) {
            i(vnode, false /* hydrating */);
        }
        if (isDef(vnode.componentInstance)) {
            initComponent(vnode, insertedVnodeQueue);
            insert(parentElm, vnode.elm, refElm);
            if (isTrue(isReactivated)) {
            reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
            }
            return true
        }
    }

节点生命周期钩子函数init

    init: function init (vnode, hydrating) {
        ...
        var child = vnode.componentInstance = createComponentInstanceForVnode(
            vnode,
            activeInstance
        );
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }

创建组件实例

    function createComponentInstanceForVnode (
    vnode, // we know it's MountedComponentVNode but flow doesn't
    parent // activeInstance in lifecycle state
    ) {
        var options = {
            _isComponent: true,
            _parentVnode: vnode,
            parent: parent
        };
        // check inline-template render functions
        var inlineTemplate = vnode.data.inlineTemplate;
        if (isDef(inlineTemplate)) {
            options.render = inlineTemplate.render;
            options.staticRenderFns = inlineTemplate.staticRenderFns;
        }
        return new vnode.componentOptions.Ctor(options)
    }

11. home组件实例的生成过程与根组件基本一致，但是与根组件不同的是home组件对象中没有el属性，也就是没有组件根元素的id或引用，所以在_init方法中未执行`vm.$mount(vm.$options.el)`，而是在节点生命周期钩子函数init中，生成组件实例（_init执行完成）之后，调用了$mount函数。

12. 之后依次调用`$mount` -> `mountComponent` -> `vm._update(vm._render(), hydrating)` -> `vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false)`,render函数是在编译时生成。render生成VNode节点实例，节点实例包含文本子节点。并将节点实例传入__patch__，利用patch方法将节点实例渲染成DOM节点，并将生成的DOM根元素保存在VNode节点实例上。并将根元素添加到父节点上，完成整个页面的渲染。

编译生成的render函数，保存在组件对象中：

    render = function() {
        var _vm = this
        var _h = _vm.$createElement
        var _c = _vm._self._c || _h
        return _c("div", { staticClass: "bus" }, [_vm._v("\n   abc\n")])
    }