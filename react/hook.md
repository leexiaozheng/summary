1. Hook 是一些可以让你在函数组件里“钩入” React state 及生命周期等特性的函数。
2. 它可以让你在不编写 class 的情况下使用 state 以及其他的 React 特性。
3. React 需要为共享状态逻辑提供更好的原生途径
4. 在多数情况下，不可能将组件拆分为更小的粒度，因为状态逻辑无处不在。这也给测试带来了一定挑战。同时，这也是很多人将 React 与状态管理库结合使用的原因之一。
5. 当你调用 useEffect 时，就是在告诉 React 在完成对 DOM 的更改后运行你的“副作用”函数。副作用函数还可以通过返回一个函数来指定如何“清除”副作用，会在组件销毁时调用。
6. Hook 使用规则
   - 只能在函数最外层调用 Hook。不要在循环、条件判断或者子函数中调用。
   - 只能在 React 的函数组件中调用 Hook。不要在其他 JavaScript 函数中调用（除自定义的 Hook）。
7. 自定义 Hook 可以在组件之间重用一些状态逻辑。和高阶组件和 render props 功能相同，但不增加新的组件。
8. 使用 Hook 其中一个目的就是要解决 class 中**生命周期函数经常包含不相关的逻辑**，但又把相关逻辑分离到了几个不同方法中的问题。你可以使用多个 state 的 Hook 一样，你也可以使用多个 effect。这会将不相关逻辑分离到不同的 effect 中。比如把计数功能和订阅功能单独开来，从横向变成竖向拆分，比如把 componentDidMount、componentDidUpdate、componentDidMount 拆分成多个，每个里面的功能不一，Hook 允许我们按照代码的用途分离他们。
9. 如果某些特定值在两次重渲染之间没有发生变化，你可以通知 React 跳过对 effect 的调用，只要传递数组作为 useEffect 的第二个可选参数即可,如果数组中有多个元素，即使只有一个元素发生变化，React 也会执行 effect。如果想执行只运行一次的 effect（仅在组件挂载和卸载时执行），可以传递一个空数组（[]）作为第二个参数。这就告诉 React 你的 effect 不依赖于 props 或 state 中的任何值，所以它永远都不需要重复执行。

```javascript
useEffect(() => {
  document.title = `You clicked ${count} times`;
}, [count]); // 仅在 count 更改时更新
```

10. api

    - 基础 Hook

      - useState
      - useEffect
      - useContext

    - 额外的 Hook

      - useReducer
      - useCallback
      - useMemo
      - useRef
      - useImperativeHandle
      - useLayoutEffect
      - useDebugValue
