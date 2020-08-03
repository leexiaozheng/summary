- describe块称为"测试套件"（test suite），表示一组相关的测试。它是一个函数，第一个参数是测试套件的名称（"加法函数的测试"），第二个参数是一个实际执行的函数。

- it块称为"测试用例"（test case），表示一个单独的测试，是测试的最小单位。它也是一个函数，第一个参数是测试用例的名称（"1 加 1 应该等于 2"），第二个参数是一个实际执行的函数。

- 所谓"断言"，就是判断源码的实际执行结果与预期结果是否一致，如果不一致就抛出一个错误。

- 所有的测试用例（it块）都应该含有一句或多句的断言。它是编写测试用例的关键。断言功能由断言库来实现，Mocha本身不带断言库，所以必须先引入断言库。

- 基本上，expect断言的写法都是一样的。头部是expect方法，尾部是断言方法，比如equal、a/an、ok、match等。两者之间使用to或to.be连接。

- 如果expect断言不成立，就会抛出一个错误。事实上，只要不抛出错误，测试用例就算通过。

- mocha命令后面紧跟测试脚本的路径和文件名，可以指定多个测试脚本。

```
mocha add.test.js
mocha file1 file2 file3
```

- 加上--recursive参数，这时test子目录下面所有的测试用例----不管在哪一层----都会执行

```
mocha --recursive
```

- 命令行指定测试脚本时，可以使用通配符，同时指定多个文件。

- 使用mochawesome模块，可以生成漂亮的HTML格式的报告。

- --watch参数用来监视指定的测试脚本。只要测试脚本有变化，就会自动运行Mocha。

- Mocha允许在test目录下面，放置配置文件mocha.opts，把命令行参数写在里面。把这三个参数写入test目录下的mocha.opts文件。

```
--reporter tap
--recursive
--growl
```

- 如果测试脚本是用ES6写的，那么运行测试之前，需要先用Babel转码。进入demo04目录，打开test/add.test.js文件，可以看到这个测试用例是用ES6写的。

    - 安装Babel

    ```
    npm install babel-core babel-preset-es2015 --save-dev
    ```
    - 在项目目录下面，新建一个.babelrc配置文件

    ```
    {
        "presets": [ "es2015" ]
    }
    ```
    - 使用--compilers参数指定测试脚本的转码器。--compilers参数后面紧跟一个用冒号分隔的字符串，冒号左边是文件的后缀名，右边是用来处理这一类文件的模块名。上面代码表示，运行测试之前，先用babel-core/register模块，处理一下.js文件。由于这里的转码器安装在项目内，所以要使用项目内安装的Mocha；如果转码器安装在全局，就可以使用全局的Mocha。
    ```
    ../node_modules/mocha/bin/mocha --compilers js:babel-core/register
    ```

- Babel默认不会对Iterator、Generator、Promise、Map、Set等全局对象，以及一些全局对象的方法（比如Object.assign）转码。如果你想要对这些对象转码，就要安装babel-polyfill。然后，在你的脚本头部加上一行。

```
$ npm install babel-polyfill --save
```
```
import 'babel-polyfill'
```

- 测试的超时时限指定为5000毫秒。

```
mocha -t 5000 timeout.test.js
```

- Mocha内置对Promise的支持，允许直接返回Promise，等到它的状态改变，再执行断言，而不用显式调用done方法。

- Mocha在describe块之中，提供测试用例的四个钩子：before()、after()、beforeEach()和afterEach()。它们会在指定时间执行。

```
describe('hooks', function() {

  before(function() {
    // 在本区块的所有测试用例之前执行
  });

  after(function() {
    // 在本区块的所有测试用例之后执行
  });

  beforeEach(function() {
    // 在本区块的每个测试用例之前执行
  });

  afterEach(function() {
    // 在本区块的每个测试用例之后执行
  });

  // test cases
});
```

- 可以用only方法。describe块和it块都允许调用only方法，表示只运行某个测试套件或测试用例。skip方法，表示跳过指定的测试套件或测试用例。