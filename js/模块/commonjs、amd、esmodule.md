## esmodule

1. 可能会看到 .mjs 扩展名的使用。V8 推荐了这样的做法，比如有下列理由：

   - 比较清晰，这可以指出哪些文件是模块，哪些是常规的 JavaScript。
   - 这能保证你的模块可以被运行时环境和构建工具识别，比如 Node.js 和 Babel。

2. 模块应用到我们的 HTML 页面。 你需要把 type="module" 放到 `<script>` 标签中, 来声明这个脚本是一个模块.

3. 加载一个模块脚本时不需要使用 defer 属性，模块会自动延迟加载。

### 1. 导出模块

单个导出：

```javascript
export const name = "square";
```

多个导出：

```javascript
export { name, draw, reportArea, reportPerimeter };
```

默认导出：

```javascript
export default randomSquare;
```

### 2. 导入模块

导入：

```javascript
import { name, draw, reportArea, reportPerimeter } from "./modules/square.mjs";
```

默认导入：

```javascript
import randomSquare from "./modules/square.mjs";
```

混合导入：

```javascript
import { default as randomSquare, name, draw } from "./modules/square.mjs";
```

### 3. 重命名

导出重命名：

```javascript
export { function1 as newFunctionName, function2 as anotherNewFunctionName };
```

导入重命名：

```javascript
import {
  function1 as newFunctionName,
  function2 as anotherNewFunctionName
} from "/modules/module.mjs";
```

### 4. 创建模块对象

导入每一个模块功能到一个模块对象上

```javascript
import * as Module from "/modules/module.mjs";

Module.draw();
```

### 5. 直接导出导入的模块

```javascript
export {
  Square
} from "/js-examples/modules/module-aggregation/modules/shapes/square.mjs";
```

### 6. 动态加载模块

```javascript
import("/js-examples/modules/dynamic-module-imports/modules/square.mjs").then(
  Module => {
    let square = new Module.Square(50, 50, 100, "blue");
  }
);
```

### 循环引用



## commonjs

1. Node 应用由模块组成，采用 CommonJS 模块规范。

2. CommonJS 规范规定，每个模块内部，module 变量代表当前模块。这个变量是一个对象，它的 exports 属性（即 module.exports）是对外的接口。加载某个模块，其实是加载该模块的 module.exports 属性。

3. 模块可以多次加载，但是只会在第一次加载时运行一次，然后运行结果就被缓存了，以后再加载，就直接读取缓存结果。要想让模块再次运行，必须清除缓存。

4. 每个文件就是一个模块，每个模块都有一个 module 对象，包含一下属性

    - module.id 模块的识别符，通常是带有绝对路径的模块文件名。
    - module.filename 模块的文件名，带有绝对路径。
    - module.loaded 返回一个布尔值，表示模块是否已经完成加载。
    - module.parent 返回一个对象，表示调用该模块的模块。
    - module.children 返回一个数组，表示该模块要用到的其他模块。
    - module.exports 表示模块对外输出的值。

```javascript
var jquery = require("jquery");
exports.$ = jquery;
console.log(module);
```

控制台输出：

```javascript
{ id: '.',
  exports: { '$': [Function] },
  parent: null,
  filename: '/path/to/example.js',
  loaded: false,
  children:
   [ { id: '/path/to/node_modules/jquery/dist/jquery.js',
       exports: [Function],
       parent: [Circular],
       filename: '/path/to/node_modules/jquery/dist/jquery.js',
       loaded: true,
       children: [],
       paths: [Object] } ],
  paths:
   [ '/home/user/deleted/node_modules',
     '/home/user/node_modules',
     '/home/node_modules',
     '/node_modules' ]
}
```

### 循环引用

模块运行时这个模块就已经存在了，而模块导出的部分随着模块执行会发生变化。当模块A执行中需要导入模块B，将会中止执行模块A，转而执行导入模块B，如果模块B又引用了当前模块A，由于当前模块A已存在，不会再次重新运行，此时模块B拿到是执行未完成的模块A。等到导入的模块B执行完成时，继续执行模块A未执行部分。

> commonJS的模块是一个对象，在刚进入模块时，导出结果是个空对象，执行过程中在这个对象上添加需要导出的内容。别的模块得到的引用对象则仅仅只是这个导出对象的引用。

### amd

于Node.js主要用于服务器编程，模块文件一般都已经存在于本地硬盘，所以加载起来比较快，不用考虑非同步加载的方式，所以CommonJS规范比较适用。但是，如果是浏览器环境，要从服务器端加载模块，这时就必须采用非同步模式，因此浏览器端一般采用AMD规范。