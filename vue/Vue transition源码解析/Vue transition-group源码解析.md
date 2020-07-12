1. 加载或者更新transiton-group组件DOM时，执行render函数，生成标签对应的节点（虚拟节点VNode）。在render函数中，获取transition-group标签内的子标签列表节点（插槽），并将transition-group标签上的数据依次添加子标签节点上。同时通过和更新前的子标签节点对比，保存本次更新仍存在的子节点，以及删除的节点。最后返回span标签节点（或者用户定义的标签），子标签列表作为子节点添加到该标签节点中。

> transition-group动画的实现原理和transition一致，不同的是transition将标签上的数据添加到一个子标签节点上，transition-group是将标签上的数据依次添加到标签列表每个节点上，可以理解为transition-group相当于在每个子标签外面添加了transiton标签。

> transition-group组件选项中存在beforeMount周期函数，在组件加载或者更新DOM之前调用。在该周期函数中，重新封装了_update函数，将在render执行完成返回节点时调用，首先调用__patch__，将当前仍存在的标签节点作为新节点，移除当前不存在的节点，然后在调用原始的update函数，将当前仍存在的标签节点作为旧节点，添加新增的节点。封装后的_update函数执行了两次__patch__,第一次是从document移除当前不存在的旧节点，第二次是添加新节点到document中，完成更新。

> 完成更新后，将会调用transition-group组件选项内的updated钩子函数，添加列表整体的过渡效果。标签节点添加到document中完成更新后立即通过transform移动到原先的位置，再通过动画移动到当前位置，形成动效。

```javascript
var props = extend({
  tag: String,
  moveClass: String
}, transitionProps);

delete props.mode;

var TransitionGroup = {
  props: props,

  beforeMount: function beforeMount () {
    var this$1 = this;

    var update = this._update;
    this._update = function (vnode, hydrating) {
      var restoreActiveInstance = setActiveInstance(this$1);
      // force removing pass
      this$1.__patch__(// 移除当前不存在的旧标签
        this$1._vnode,// 旧标签
        this$1.kept,// 当前保留的旧标签
        false, // hydrating
        true // removeOnly (!important, avoids unnecessary moves)
      );
      this$1._vnode = this$1.kept;
      restoreActiveInstance();
      update.call(this$1, vnode, hydrating);// 添加当前新增的标签,并调整节点的顺序
    };
  },

  render: function render (h) {
    var tag = this.tag || this.$vnode.data.tag || 'span';
    var map = Object.create(null);
    var prevChildren = this.prevChildren = this.children;// 上一次组件标签内的标签节点（插槽）
    var rawChildren = this.$slots.default || [];// 当前组件标签内的标签节点（插槽）
    var children = this.children = [];
    var transitionData = extractTransitionData(this);// 获取标签上的属性

    for (var i = 0; i < rawChildren.length; i++) {
      var c = rawChildren[i];
      if (c.tag) {
        if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
          children.push(c);
          map[c.key] = c// 当前组件标签内的标签节点的key映射
          ;(c.data || (c.data = {})).transition = transitionData;// 将标签上的属性保存在插槽节点上
        } else if (process.env.NODE_ENV !== 'production') {
          var opts = c.componentOptions;
          var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
          warn(("<transition-group> children must be keyed: <" + name + ">"));
        }
      }
    }

    if (prevChildren) {
      var kept = [];
      var removed = [];
      for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
        var c$1 = prevChildren[i$1];
        c$1.data.transition = transitionData;
        c$1.data.pos = c$1.elm.getBoundingClientRect();
        if (map[c$1.key]) {
          kept.push(c$1);//本次中在上一次出现过的插槽节点
        } else {
          removed.push(c$1);//本次中未出现上一次的插槽节点
        }
      }
      this.kept = h(tag, null, kept);// 根据上一次也出现过的插槽节点生成组件渲染节点
      this.removed = removed;
    }

    return h(tag, null, children)
  },

  updated: function updated () {// 此时位置已经完成了更新
    var children = this.prevChildren;
    var moveClass = this.moveClass || ((this.name || 'v') + '-move');
    if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
      return
    }

    // we divide the work into three loops to avoid mixing DOM reads and writes
    // in each iteration - which helps prevent layout thrashing.
    children.forEach(callPendingCbs);
    children.forEach(recordPosition);
    children.forEach(applyTranslation);// 从当前位置移动到之前位置

    // force reflow to put everything in position
    // assign to this to avoid being removed in tree-shaking
    // $flow-disable-line
    this._reflow = document.body.offsetHeight;

    children.forEach(function (c) {
      if (c.data.moved) {
        var el = c.elm;
        var s = el.style;
        addTransitionClass(el, moveClass);// 添加类名开始动画
        s.transform = s.WebkitTransform = s.transitionDuration = '';// 再从之前位置移动到当前位置
        el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
          if (e && e.target !== el) {
            return
          }
          if (!e || /transform$/.test(e.propertyName)) {
            el.removeEventListener(transitionEndEvent, cb);
            el._moveCb = null;
            removeTransitionClass(el, moveClass);// 动画完成移除类名
          }
        });
      }
    });
  },

  methods: {
    hasMove: function hasMove (el, moveClass) {
      /* istanbul ignore if */
      if (!hasTransition) {
        return false
      }
      /* istanbul ignore if */
      if (this._hasMove) {
        return this._hasMove
      }
      // Detect whether an element with the move class applied has
      // CSS transitions. Since the element may be inside an entering
      // transition at this very moment, we make a clone of it and remove
      // all other transition classes applied to ensure only the move class
      // is applied.
      var clone = el.cloneNode();// 通过clone并添加到document中获取dom样式属性
      if (el._transitionClasses) {// 移除transition类名
        el._transitionClasses.forEach(function (cls) { removeClass(clone, cls); });
      }
      addClass(clone, moveClass);// 添加类名
      clone.style.display = 'none';
      this.$el.appendChild(clone);
      var info = getTransitionInfo(clone);
      this.$el.removeChild(clone);
      return (this._hasMove = info.hasTransform)
    }
  }
};
```