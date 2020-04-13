1. 开发编译时，会将vue文件中的template转化成render函数，供运行时调用；

2. template变成render的过程，template转化成ast(抽象语法树)，再将ast转化成代码字符串`（_c('div',[_c('span',[_v("1234")]),_c('app')],1)）`,再拼接该字符串`"with(this){return " + code + "}"`,再将拼接后的字符串作为参数放到`new Function(code)`中，然后赋值给render，render调用时触发new Function(code)；

3. Vue根组件创建时`new Vue()`，会将构造器参数中的template转化成render函数，并挂载在组件实例上；

4. 调用根组件实例的render函数渲染页面时，当存在子组件时`_c('app')`，会从components中找到子组件的参数，根据参数使用`Vue.extend()`创建子组件，参数中包含在编译时创建的render函数，依次往下调用render函数渲染页面；