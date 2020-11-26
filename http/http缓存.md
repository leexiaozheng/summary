常见的 HTTP 缓存只能存储 GET 响应，对于其他类型的响应则无能为力，不是所有的 get 都能缓存。请求和响应都会经过 web 缓存。当 web 缓存发现请求的资源已经被存储，它会拦截请求，返回该资源的副本，而不会去源服务端重新下载。当 web 缓存接收到响应时，添加或者更新资源的副本，更新副本的过期时间等等；

---

缓存可以分为私有浏览器缓存和共享代理缓存：

- 私有浏览器缓存：只能被单个用户使用，比如 Web 浏览器中有内建的私有缓存

- 共享代理缓存：可以被多个用户使用，比如缓存代理服务器

### 缓存相关的头部信息

#### 请求头

1. Cache-Control：在 HTTP/1.1 中 定义， 请求头和响应头都支持这个属性。通过它提供的不同的值来定义缓存策略。指令不区分大小写，并且具有可选参数，可以用令牌或者带引号的字符串语法。多个指令以逗号分隔。

   - `Cache-Control: max-age=<n>`：当客户端发送带有 max-age 的指令时，缓存会判断副本的缓存时间和 max-age 值 的大小。如果比 max-age 值 小，那么副本有效，可以继续给客户端返回缓存的副本。如果比 max-age 值 大，则向服务端请求资源。
   - `Cache-Control: max-stale[=<n>]`：客户端可以接受缓存时间超过 max-age 的副本，但超过时间不能大于 max-state 值。也就是说客户端可以接受缓存时间小于 max-age 和 max-stale 值之和的副本。
   - `Cache-Control: min-fresh=<seconds>`：保证资源在指定时间内仍是新鲜的，即指定时间内代理服务器的过期资源无法作为响应返回。
   - `Cache-control: no-cache`：不直接使用缓存中的副本（即使副本未过期） ，需要重新向服务器进行验证，若未过期，才使用本地缓存副本。
   - `Cache-control: no-store`：请求忽略缓存，每次由客户端发起的请求都会下载完整的响应内容。
   - `Cache-control: no-transform`：缓存服务器不得对资源进行转换或转变。
   - `Cache-control: only-if-cached`：客户端只接受已缓存的响应，并且不要向原始服务器检查资源是否有更新。

2. If-Match：当客户端 If-Match 的值和与服务端的 ETag 一致，服务端才会正常响应请求，否则返回状态码 412
3. If-Modified-Since： 服务器只在所请求的资源在给定的日期时间之后对内容进行过修改的情况下才会将资源返回，状态码为 200 。如果请求的资源从那时起未经修改，那么返回一个不带有消息主体的 304 响应，而在 Last-Modified 首部中会带有上次修改时间。 不同于 If-Unmodified-Since, If-Modified-Since 只可以用在 GET 或 HEAD 请求中。当与 If-None-Match 一同出现时，If-Modified-Since 会被忽略掉，除非服务器不支持 If-None-Match。

4. If-None-Match：请求头 If-None-Match 的值与服务端的 ETag 一致，表示服务端资源未修改，返回状态码 304，直接使用缓存副本。如果不一致则响应时发送该资源，状态码为 200。
5. Pragma：是 HTTP/1.0 标准中定义的一个 header 属性，请求中包含 Pragma 的效果跟在头信息中定义 Cache-Control: no-cache 相同

#### 响应头

1. Cache-Control：

   - `Cache-control: public`：表明相应内容可以被任何对象（客户端浏览器、代理服务器等等）缓存，即使是通常不可以缓存的内容也可以缓存；
   - `Cache-control: private`：表明响应内容只能被单个用户（客户端浏览器）缓存；
   - `Cache-control: no-store`：不能对服务器响应内容进行缓存；
   - `Cache-control: no-cache`：不直接使用缓存中的副本（即使副本未过期），需要重新向服务器进行验证，若未过期，才使用本地缓存副本。；
   - `Cache-Control: max-age=<seconds>`：缓存存储的时间，超过这个时间缓存过期；
   - `Cache-control: s-maxage=<seconds>`：缓存存储的时间，超过这个时间缓存过期，会覆盖 max-age 和 Expires，仅适用于共享代理缓存；
   - `Cache-control: must-revalidate`：触发缓存验证，缓存过期前，可以使用缓存；缓存过期后，必须向服务器进行验证；
   - `Cache-control: proxy-revalidate`：缓存过期前，可以使用缓存；缓存过期后，必须服务器进行验证。仅适用于共享代理缓存；
   - `Cache-control: no-transform`：告诉代理不要改变资源的格式。代理有时会改变图片以及文件的格式，从而达到提高性能的效果；

2. Age：非负整数，表示对象在缓存代理服务器中存储的时长（秒）。Age 的值通常接近于 0，表示资源刚刚从原始服务器获取；
3. Date：报文创建的时间
4. Etage：与特定资源关联的确定值，当资源更新后 Etag 也会随之更新。如果资源请求的响应头中含有 Etag，客户端可以在后续请求头带上 If-None-Match 来验证缓存。
5. Expires：包含时间，在此时间之后，表示响应过期，通过比较 Expires 的值和 Date 属性的值来判断是否缓存有效
6. Last-Modified：源头服务端认定的资源修改时间。 它通常被用作一个验证器来判断接收到的或者存储的资源是否彼此一致。由于精确度比 ETag 要低，所以这是一个备用机制。包含有 If-Modified-Since 或 If-Unmodified-Since 首部的条件请求会使用这个字段。如果响应头里包含这个信息，客户端可以在后续的请求中带上 If-Modified-Since 来验证缓存。
7. Vary：缓存代理，根据 URI 和 Vary 指定的头部字段区分内容。Vary 字段用于列出一个响应字段列表，告诉缓存服务器遇到同一个 URL 对应着不同版本文档的情况时，如何缓存和筛选合适的版本。客户端可以使其从缓存服务器获取到相应应用类型的缓存版本，而不是错误地将桌面版缓存传递给移动版应用。标示了服务器在服务端驱动型内容协商阶段所使用的首部清单。这个首部是必要的，它可以用来通知缓存服务器决策的依据，这样它可以进行复现，使得缓存服务器在预防将错误内容提供给用户方面发挥作用。
8. Pragma：是 HTTP/1.0 标准中定义的一个 header 属性，请求中包含 Pragma 的效果跟在头信息中定义 Cache-Control: no-cache 相同

优先级：

- Cache-control:max-age=<N>
- Expires
- Last-Modified

### 缓存方式

#### 不缓存

1. Cache-Control：no-store；缓存中不得存储任何关于客户端请求和服务端响应的内容。每次由客户端发起的请求都会下载完整的响应内容。

#### 缓存验证

每次有请求发出时，缓存会将此请求发到服务器（该请求应该会带有与本地缓存相关的验证字段），服务器端会验证请求中所描述的缓存是否过期，若未过期（就返回 304），则缓存才使用本地缓存副本。`Cache-Control: no-cache；`或者`Cache-Control：max-age=0`表示需要进行缓存验证。`Pragma` 是 HTTP/1.0 标准中定义的一个 header 属性，请求中包含`Pragma`的效果跟在头信息中定义`Cache-Control: no-cache`相同，但是 HTTP 的响应头没有明确定义这个属性，所以它不能拿来完全替代 HTTP/1.1 中定义的`Cache-control`头。如果缓存的响应头信息里含有`Cache-control: must-revalidate`的定义，在浏览的过程中也会触发缓存验证。

1. ETags 作为缓存的一种强校验器。特定资源关联的确定值。如果资源请求的响应头里含有 ETag, 客户端可以在后续的请求的头中带上 If-None-Match 头来验证缓存。服务器将客户端的 If-None-Match 与其当前版本的资源的 ETag 进行比较，如果两个值匹配（即资源未更改），服务器将返回不带任何内容的 304 未修改状态，告诉客户端缓存版本可用（新鲜）。

2. Last-Modified 响应头可以作为一种弱校验器。包含源头服务器认定的资源做出修改的日期及时间。如果响应头里含有这个信息，客户端可以在后续的请求中带上 If-Modified-Since 来验证缓存。

> ETags 的优先级高于 Last-Modified

> pragma 的优先级高于 cache-control

#### 缓存类型

1. Cache-Control: public；"public" 指令表示该响应可以被任何中间人（比如中间代理、CDN 等）缓存。一些通常不被中间人缓存的页面（比如 带有 HTTP 验证信息（帐号密码）的页面 或 某些特定状态码的页面），将会被其缓存。

2. Cache-Control: private；"private" 表示该响应是专用于某单个用户的，中间人不能缓存此响应，该响应只能应用于浏览器私有缓存中。

#### 验证方式

1. Cache-Control: must-revalidate 当使用了 "must-revalidate" 指令，那就意味着缓存在考虑使用一个陈旧的资源时，必须先验证它的状态，已过期的缓存将不被使用。

#### 缓存期限

1. `Cache-Control: max-age=<seconds>`和`Expires`，表示资源能够被缓存（保持新鲜）的最大时间，客户端直接读取缓存数据（不验证）。相对 Expires 而言，max-age 是距离请求发起的时间的秒数。

> `Cache-Control: max-age=<seconds>`的优先级高于 Expires

### 缓存优化

在文件名中添加内容生成 Etag 值，设置更长的缓存过期时长。文件发生变化，文件名也会发生变化，作为完全新的独立的资源。文件命名和访问链接的更改通过自动化构建工具实现。
