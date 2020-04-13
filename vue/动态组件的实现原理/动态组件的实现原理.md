```javascript
import Vue from 'vue';
import App from './app.vue';
import Home from './home.vue';

new Vue({
    el: '#app',
    data() {
        return {
            component: App,
        };
    },
    template: `<div><button @click="toSwitch">切换</button><component :is="component"/></div>`,
    components: { App, Home },// 注册组件，注册的组件名称为"App"、"Home"
    methods: {
        toSwitch() {
            if (this.component === App) {
                this.component = Home;
            } else {
                this.component = App;
            }
        },
    },
});
```

```html
<template>
    <div>app</div>
</template>

<script>
    export default {
        name: 'app',
    };
</script>
```

```html
<template>
    <div>home</div>
</template>

<script>
    export default {
        name: 'home',
    };
</script>
```

```javascript
with (this) {
    return _c('div', [_c('button', { on: { click: toSwitch } }, [_v('切换')]), _c(component, { tag: 'component' })], 1);
}
```
1. 如果component标签的is属性值是组件选项对象，直接根据该组件选项对象创建节点（VNode实例）。如果component标签的is属性值是components中注册的组件名称，则根据该组件名称去components找到该组件名称对应的组件选项对象，再根据该组件选项对象创建节点。

```javascript
function _createElement (
  context,comp
  tag,
  data, 
  children,
  normalizationType
) {
  ...
  if (typeof tag === 'string') {
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
    ...
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {/* 根据该组件名称去components找到该组件名称对应的组件选项对象 */
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
    ...
    }
  } else {
    ...
    vnode = createComponent(tag, data, context, children);// 此时tag指向组件选项对象,直接根据组件选项对象创建节点。data值为{tag:"component"}
  }
  ...
}
```