JSON Web Token（JWT）是一个轻量级的认证规范，这个规范允许我们使用 JWT 在用户和服务器之间传递安全可靠的信息。其本质是一个 token，是一种紧凑的 URL 安全方法，用于在网络通信的双方之间传递。

### JWT 认证过程

1. 客户端发送用户名和密码给服务端。
2. 服务端验证通过后，利用私钥生成 token 信息，token 信息包含有效期等信息。
3. 服务端将 token 发送给客户端。
4. 客户端在后续接口请求中携带 token 信息。
5. 服务端判断 token 是否被篡改，是否有效，验证通过后才正常响应接口请求。
6. 验证失败后需要客户端输入用户名和密码重新登录认证。

### JWT 特点

1. 支持多个服务共享登录信息
2. 服务端利用私钥生成 token，保存在客户端，token 包含有效期等信息。

### JWT 的数据结构

三个部分构成的字符串，中间用点（.）分隔：

`3AD9D8Ddkaf8Dfaga.aff39DF9asdfaDsgaD.23seWdfg4FsSHIHI`

这三个部分分别是

- Header（头部）
- Payload（负载）
- Signature（签名）

拼接：`Header.Payload.Signature`

#### Header

JSON 对象：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

alg:属性表示签名的算法（algorithm），type:属性表示 token 的类型，JWT 令牌统一写为 JWT，然后使用 Base64URL 算法将 JSON 对象转成字符串。

#### Payload

JSON 对象，包含以下字段：

- iss (issuer)：签发人
- exp (expiration time)：过期时间
- sub (subject)：主题
- aud (audience)：受众
- nbf (Not Before)：生效时间
- iat (Issued At)：签发时间
- jti (JWT ID)：编号

除了以上字段还可以自定义字段，然后使用 Base64URL 算法将 JSON 对象转成字符串。

#### Signature

使用服务器的密钥对`Header`和`Payload`的签名，生成 Signature

最后 Header、Payload、Signature 拼成一个字符串，各部分之间用"点"（.）分隔。
