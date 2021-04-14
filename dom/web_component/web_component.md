Web Components

Web Component 可以创建可重用的定制元素。

### custom elements
```javascript
// <tree-select></tree-select>
class TreeSelect extends HTMLParagraphElement {
    constructor() {
        super();
    }
    // 插入文档DOM时
    connectedCallback() {}
    // 从文档中删除时
    disconnectedCallback() {}
    // 被移动到新的文档时
    adoptedCallback() {}
    // 增加、删除、修改自身属性时被调用
    attributeChangeCallback() {}
}
customElements.define('tree-select',TreeSelect)
// <ul is='card-list'></ul>
class CardList extends HTMLUListElement {
    constructor() {
        super();
    }
}
customElement.define('card-list',CardList,{extends: 'ul'})
```

### shadow DOM

1. Shadow DOM接口是关键所在，它可以将一个隐藏的、独立的DOM附加到一个元素上。以shadow root节点为起始根节点。
    - `Element.attachShadow({mode: 'open'|'closed'})`方法来将一个shadow root附加到任何一个元素上，参数中mode表示外部是否可以获取shadow root。
```javascript
// Create a class for the element
class PopUpInfo extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    // Create a shadow root
    const shadow = this.attachShadow({mode: 'open'});

    // Create spans
    const wrapper = document.createElement('span');
    wrapper.setAttribute('class', 'wrapper');

    const icon = document.createElement('span');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('tabindex', 0);

    const info = document.createElement('span');
    info.setAttribute('class', 'info');

    // Take attribute content and put it inside the info span
    const text = this.getAttribute('data-text');
    info.textContent = text;

    // Insert icon
    let imgUrl;
    if(this.hasAttribute('img')) {
      imgUrl = this.getAttribute('img');
    } else {
      imgUrl = 'img/default.png';
    }

    const img = document.createElement('img');
    img.src = imgUrl;
    icon.appendChild(img);

    // Create some CSS to apply to the shadow dom
    const style = document.createElement('style');
    console.log(style.isConnected);

    style.textContent = `
      .wrapper {
        position: relative;
      }

      .info {
        font-size: 0.8rem;
        width: 200px;
        display: inline-block;
        border: 1px solid black;
        padding: 10px;
        background: white;
        border-radius: 10px;
        opacity: 0;
        transition: 0.6s all;
        position: absolute;
        bottom: 20px;
        left: 10px;
        z-index: 3;
      }

      img {
        width: 1.2rem;
      }

      .icon:hover + .info, .icon:focus + .info {
        opacity: 1;
      }
    `;

    // Attach the created elements to the shadow dom
    shadow.appendChild(style);
    console.log(style.isConnected);
    shadow.appendChild(wrapper);
    wrapper.appendChild(icon);
    wrapper.appendChild(info);
  }
}

// Define the new element
customElements.define('popup-info', PopUpInfo);

```

### template、slot

1. 当您必须在网页上重复使用相同的标记结构时，使用某种模板而不是一遍又一遍地重复相同的结构是有意义的。以前这是可行的，但HTML <template> 元素使它更容易实现(这在现代浏览器中得到了很好的支持)。 此元素及其内容不会在DOM中呈现，但仍可使用JavaScript去引用它。

```html
<template id="my-paragraph">
  <p>My paragraph</p>
</template>
```
```javascript
let template = document.getElementById('my-paragraph');
let templateContent = template.content;
document.body.appendChild(templateContent);
```

2.  <slot> 能在单个实例中通过声明式的语法展示不同的文本。要定义插槽内容，我们在<my-paragraph>元素内包括一个HTML结构，该结构具有slot属性，其值等于我们要填充的<slot>的name属性的值。 和以前一样，它可以是您喜欢的任何东西，例如：
```html
<my-paragraph>
  <span slot="my-text">Let's have some different text!</span>
</my-paragraph>
```
或者
```html
<my-paragraph>
  <ul slot="my-text">
    <li>Let's have some different text!</li>
    <li>In a list!</li>
  </ul>
</my-paragraph>
```