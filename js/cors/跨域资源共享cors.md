跨源资源共享 (CORS) （或通俗地译为跨域资源共享）是一种基于 HTTP 头的机制，该机制通过允许服务器标识除了它自己以外的其它 origin（域，协议和端口），这样浏览器可以访问加载这些资源。

跨源资源共享标准新增了一组 HTTP 首部字段，允许服务器声明哪些源站通过浏览器有权限访问哪些资源。另外，规范要求，对那些可能对服务器数据产生副作用的 HTTP 请求方法（特别是 GET 以外的 HTTP 请求，或者搭配某些 MIME 类型的 POST 请求），浏览器必须首先使用 OPTIONS 方法发起一个预检请求，从而获知服务端是否允许该跨源请求。服务器确认允许之后，才发起实际的 HTTP 请求。

跨域资源共享标准场景：

- XMLHttpRequest 或 Fetch 发起的跨源 HTTP 请求。
- Web 字体 (CSS 中通过 @font-face 使用跨源字体资源)，因此，网站就可以发布 TrueType 字体资源，并只允许已授权网站进行跨站调用。
- WebGL 贴图
- 使用 drawImage 将 Images/video 画面绘制到 canvas

### 简单请求

不会触发 CORS 预检请求。满足所有下述条件的请求可视为“简单请求”：

（1) 请求方法是以下三种方法之一：

HEAD
GET
POST
（2）HTTP的头信息不超出以下几种字段：

Accept
Accept-Language
Content-Language
Last-Event-ID
Content-Type：只限于三个值application/x-www-form-urlencoded、multipart/form-data、text/plain

- 使用下列方法之一：
  - GET
  - HEAD
  - POST
- HTTP的头信息不超出以下几种字段：：
  - Accept
  - Accept-Language
  - Content-Language
  - Content-Type （需要注意额外的限制）
  - DPR
  - Downlink
  - Save-Data
  - Viewport-Widths
  - Width
- Content-Type 的值仅限于下列三者之一：
  - text/plain
  - multipart/form-data
  - application/x-www-form-urlencoded
- 请求中的任意 XMLHttpRequestUpload 对象均没有注册任何事件监听器；XMLHttpRequestUpload 对象可以使用 XMLHttpRequest.upload 属性访问。
- 请求中没有使用 ReadableStream 对象。

### 预检请求

要求必须首先使用 OPTIONS 方法发起一个预检请求到服务器，以获知服务器是否允许该实际请求。"预检请求“的使用，可以避免跨域请求对服务器的用户数据产生未预期的影响。

### 附带身份凭证的请求

一般而言，对于跨源 XMLHttpRequest 或 Fetch 请求，浏览器不会发送身份凭证信息。如果要发送凭证信息，需要设置 XMLHttpRequest 的 withCredentials 标志设置为 true，从而向服务器发送 Cookies。但是，如果服务器端的响应中未携带 Access-Control-Allow-Credentials: true ，浏览器将不会把响应内容返回给请求的发送者。

对于附带身份凭证的请求，服务器不得设置 Access-Control-Allow-Origin 的值为“\*”。

这是因为请求的首部中携带了 Cookie 信息，如果 Access-Control-Allow-Origin 的值为“\*”，请求将会失败。而将 Access-Control-Allow-Origin 的值设置为 http://foo.example，则请求将成功执行。

### HTTP 响应首部字段

1. Access-Control-Allow-Origin：指定了允许访问该资源的外域 URI。对于不需要携带身份凭证的请求，服务器可以指定该字段的值为通配符，表示允许来自所有域的请求。如果服务端指定了具体的域名而非“\*”，那么响应首部中的 Vary 字段的值必须包含 Origin。这将告诉客户端：服务器对不同的源站返回不同的内容。
2. Access-Control-Expose-Headers：让服务器把允许浏览器访问的头放入白名单。在跨源访问时，XMLHttpRequest 对象的 getResponseHeader()方法只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头。
3. Access-Control-Max-Age：指定了预检请求的结果能够被缓存多久。
4. Access-Control-Allow-Credentials：指定了当浏览器的 credentials 设置为 true 时是否允许浏览器读取 response 的内容。当用在对预检请求的响应中时，它指定了实际的请求是否可以使用 credentials。请注意：简单 GET 请求不会被预检；如果对此类请求的响应中不包含该字段，这个响应将被忽略掉，并且浏览器也不会将相应内容返回给网页。
5. Access-Control-Allow-Methods：首部字段用于预检请求的响应。其指明了实际请求所允许使用的 HTTP 方法。
6. Access-Control-Allow-Headers：其指明了实际请求中允许携带的首部字段。

### HTTP 请求首部字段

可用于发起跨源请求的首部字段。这些首部字段无须手动设置。 当开发者使用 XMLHttpRequest 对象发起跨源请求时，它们已经被设置就绪。

- Origin：表明预检请求或实际请求的源站。
- Access-Control-Request-Method：将实际请求所使用的 HTTP 方法告诉服务器。
- Access-Control-Request-Headers：将实际请求所携带的首部字段告诉服务器。
