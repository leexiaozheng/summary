### Generator函数

Generator函数function关键字与函数名之间有一个星号，函数体内使用yield表达式；
Generator函数调用返回一个遍历器对象（iterator）；
调用遍历器对象next方法时，会从函数头部或上一次停下来的地方开始执行，当遇到下一个yield表达式（或者return语句）时停止，next方法参数作为上一次执行过程中yield表达式的返回值；
next方法的返回值是yield表达式的值；


> 如果没有return语句，就执行到函数结束。

```javascript
function* generatorFunc() {
  const r1 =  yield 'first';
  console.log(r1);
  const r2 = yield 'second';
  conole.log(r2);
  return 'end';
}

var o = generatorFunc();

console.log(o.next())
// { value: 'first', done: false }

console.log(o.next('result1'))
// result1
// { value: 'second', done: false }

console.log(o.next('result2'))
// result2
// { value: 'end', done: true }

console.log(o.next())
// { value: undefined, done: true }
```

### Generator.prototype.throw、Generator.prototype.next、Generator.prototype.return

next()、throw()、return()这三个方法本质上是同一件事，可以放在一起理解。它们的作用都是让 Generator 函数恢复执行，并且使用不同的语句替换yield表达式。next()是将yield表达式替换成一个值。throw()是将yield表达式替换成一个throw语句。return()是将yield表达式替换成一个return语句。

> Generator 函数不是这样，它执行产生的上下文环境，一旦遇到yield命令，就会暂时退出堆栈，但是并不消失，里面的所有变量和对象会冻结在当前状态。等到对它执行next命令时，这个上下文环境又会重新加入调用栈，冻结的变量和对象恢复执行。