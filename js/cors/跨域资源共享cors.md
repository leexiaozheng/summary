跨源资源共享（cors）标准新增了一组 HTTP 首部字段，允许服务端声明哪些源站通过浏览器有权限访问哪些资源，这样浏览器可以访问加载这些资源。另外，规范要求，对那些可能对服务端数据产生副作用的 HTTP 请求方法（特别是 GET 以外的 HTTP 请求，或者搭配某些 MIME 类型的 POST 请求），浏览器必须首先使用 OPTIONS 方法发起一个预检请求，从而获知服务端是否允许该跨源请求。服务端确认允许之后，才发起实际的 HTTP 请求。

### 简单请求

不会触发 CORS 预检请求。满足所有下述条件的请求可视为“简单请求”：

1. 请求方法是以下三种方法之一：

   - HEAD
   - GET
   - POST

2. HTTP 的头信息不超出以下几种字段：

   - Accept
   - Accept-Language
   - Content-Language
   - Content-Type （需要注意额外的限制）
   - DPR
   - Downlink
   - Save-Data
   - Last-Event-ID
   - Viewport-Widths
   - Width

3. Content-Type 的值仅限于下列三者之一：

   - text/plain
   - multipart/form-data
   - application/x-www-form-urlencoded

4. 请求中的任意 XMLHttpRequestUpload 对象均没有注册任何事件监听器；XMLHttpRequestUpload 对象可以使用 XMLHttpRequest.upload 属性访问。
5. 请求中没有使用 ReadableStream 对象。

### 预检请求

要求必须首先使用 OPTIONS 方法发起一个预检请求到服务端，以获知服务端是否允许该实际请求。如果预检请求不通过，服务端返回正常的 http 响应，但是没有任何 CORS 相关的字段。如果预检请求通过，会返回以下部分字段：

- Access-Control-Allow-Origin：该字段必须
- Access-Control-Allow-Methods
- Access-Control-Allow-Headers
- Access-Control-Allow-Credentials
- Access-Control-Max-Age

### HTTP 响应首部字段

- Access-Control-Allow-Origin：指定了允许访问该资源的外域 URI。如果服务端指定了具体的域名而非“\*”，那么响应首部中的 Vary 字段的值必须包含 Origin。告诉客户端服务端对不同的源站返回不同的内容。
- Access-Control-Allow-Methods：指明了实际请求所允许使用的 HTTP 方法（该字段值包含 Access-Control-Request-Methods 中列出的方法时，才可能预检成功）。
- Access-Control-Allow-Headers：其指明了实际请求中允许携带的首部字段（该字段值包含 Access-Control-Request-Headers 中列出的字段时，才可能预检成功）。
- Access-Control-Max-Age：指定了预检请求的结果能够被缓存多久。
- Access-Control-Allow-Credentials：默认情况下 Cookie 不包括在 CORS 请求之中，该字段和 AJAX 的 withCredentials 属性都为 true，且 Access-Control-Allow-Origin 值不为星号，此时 Cookie 可以包含在请求中发给服务端。
- Access-Control-Expose-Headers：让服务端把允许浏览器访问的头放入白名单。在跨源访问时，XMLHttpRequest 对象的 getResponseHeader()方法只能拿到一些最基本的响应头（Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma），如果要访问其他头，则需要服务端设置本响应头。

### HTTP 请求首部字段

- Origin：预检时将实际请求的源站告诉服务端。
- Access-Control-Request-Method：预检时将实际请求所使用的 HTTP 方法告诉服务端。
- Access-Control-Request-Headers：预检请求时告诉服务端哪些非简单的 HTTP 字段实际被使用。

> 使用 XMLHttpRequest 对象发起跨源请求时，这些字段会自动设置。
