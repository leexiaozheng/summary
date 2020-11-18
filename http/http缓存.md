Web缓存是可以自动保存常见文档副本的HTTP设备。当web请求抵达缓存时，如果本地有“已缓存的”副本，就可以从本地存储设备而不是原始服务器中提取这个文档。

### 缓存分类

缓存可以分为私有浏览器缓存和共享代理缓存

#### 私有浏览器缓存

Web浏览器中有内建的私有缓存

#### 共享代理缓存

通过缓存代理服务器实现，共享代理缓存可以被多个用户使用

### 缓存过程

1. 客户端首次请求服务端资源时，服务端会在响应报文头部添加资源内容生成的hash值，以及资源最后一次修改时间。
2. 客户端再次请求该资源时，客户端会在请求报文头部添加从服务端收到的资源的hash值和最后一次修改时间。
3. 服务端会根据收到的hash和最后一次修改时间，判断资源是否和浏览器缓存中一致。如果一致，响应时状态码为304，浏览器直接从缓存中读取。如果不一致，响应时发送该资源，状态码为200。

> 服务端在判断文件是否已经修改时，hash的优先级高于最后一次修改时间。

### 缓存优化

在文件名中添加内容生成hash值，设置更长的缓存过期时长。文件发生变化，文件名也会发生变化，作为完全新的独立的资源。文件命名和访问链接的更改通过自动化构建工具实现。


### 缓存相关的头部信息



#### 请求头

1. Cache-Control：指令不区分大小写，并且具有可选参数，可以用令牌或者带引号的字符串语法。多个指令以逗号分隔。

    - `Cache-Control: max-age=<seconds>`
    - `Cache-Control: max-stale[=<seconds>]`
    - `Cache-Control: min-fresh=<seconds>`
    - `Cache-control: no-cache `
    - `Cache-control: no-store`：不能对服务器响应内容进行缓存
    - `Cache-control: no-transform`
    - `Cache-control: only-if-cached`

2. If-Match
3. If-Modified-Since
4. If-None-Match
5. If-Range
6. Pragma

#### 响应头


1. Cache-Control：指令不区分大小写，并且具有可选参数，可以用令牌或者带引号的字符串语法。多个指令以逗号分隔。

    - `Cache-control: public`：表明相应内容可以被任何对象（客户端浏览器、代理服务器等等）缓存，即使是通常不可以缓存的内容也可以缓存；
    - `Cache-control: private`：表明响应内容只能被单个用户（客户端浏览器）缓存；
    - `Cache-control: no-store`：不能对服务器响应内容进行缓存；
    - `Cache-control: no-cache`：协商缓存；
    - `Cache-Control: max-age=<seconds>`：缓存存储的时间，超过这个时间缓存过期；
    - `Cache-control: s-maxage=<seconds>`：缓存存储的时间，超过这个时间缓存过期，会覆盖max-age和Expires，仅适用于共享代理缓存；
    - `Cache-control: must-revalidate`：缓存过期前，可以使用缓存；缓存过期后，必须服务器进行验证；
    - `Cache-control: proxy-revalidate`：缓存过期前，可以使用缓存；缓存过期后，必须服务器进行验证。仅适用于共享代理缓存；
    - `Cache-control: no-transform`：告诉代理不要改变资源的格式。代理有时会改变图片以及文件的格式，从而达到提高性能的效果；

2. Age
3. Date
4. Etage
5. Expires
6. Last-Modified
7. Pragma