1.创建Vue构造函数
```javascript
function Vue$3 (options) {
  this._init(options); 
}
```

2.Vue原型上添加方法和属性
- 执行initMixin(Vue$3);添加_init方法
- 执行stateMixin(Vue$3);添加$data和$props属性；
- 执行eventsMixin(Vue$3);添加$on,$once,$off,$emit组件事件相关的方法；
- 执行lifecycleMixin(Vue$3);添加_update,$forceUpdate,$destroy生命周期的方法;
- 执行renderMixin(Vue$3);添加$nextTick,_render方法；
 
3.initGlobalAPI(Vue)在Vue构造器上添加全局的属性和方法
- Vue.config保存配置参数
- Vue.set设置数据响应式方法
- Vue.nextTick全局保存nextTick方法
- Vue.options.component全局组件
- Vue.options.filter全局过滤器
- Vue.options.directive全局指令
- Vue.options._base指向Vue构造器
- 执行initUse(Vue);添加use方法；
- 执行initMixin$1(Vue);添加mixin方法；
- 执行initExtend(Vue);添加extend方法；
- 执行initAssetRegisters(Vue);添加filter,component,directive全局注册方法；
 
4.Vue原型直接添加$mount方法，然后通过mount变量保存该方法，然后Vue原型的$mount方法又被重新创建了；
 
5.Vue添加了compile全局方法
 