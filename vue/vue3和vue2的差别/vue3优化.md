1. defineProperty 改为 proxy

2. 重构了 Virtual DOM。纯静态的节点进行 diff 其实是比较浪费资源的，更新时只 diff 动态的部分。

3. 事件缓存：针对节点绑定的事件，每次触发都要重新生成全新的 function 去更新。在 Vue3 中，提供了事件缓存对象 cacheHandlers，当 cacheHandlers 开启的时候，编译会自动生成一个内联函数，将其变成一个静态节点，这样当事件再次触发时，就无需重新创建函数直接调用缓存的事件回调方法即可。

4. 在 Vue3 中，对代码结构进行了优化，让其更加符合 Tree shaking 的结构，这样使用相关的 api 时，不会把所有的都打包进来，只会打包你用到的 api
