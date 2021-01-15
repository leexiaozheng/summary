### redis

key-value 存储系统，值（value）可以是 字符串(String), 哈希(Hash), 列表(list), 集合(sets) 和 有序集合(sorted sets)等类型。

#### 特性：

- Redis 支持数据的持久化，可以将内存中的数据保存在磁盘中，重启的时候可以再次加载进行使用。
- Redis 不仅仅支持简单的 key-value 类型的数据，同时还提供 list，set，zset，hash 等数据结构的存储。
- Redis 支持数据的备份，即 master-slave 模式的数据备份。
- 性能极高 – Redis 能读的速度是 110000 次/s,写的速度是 81000 次/s 。
- 原子 – Redis 的所有操作都是原子性的，意思就是要么成功执行要么失败完全不执行。单个操作是原子性的。多个操作也支持事务，即原子性，通过 MULTI 和 EXEC 指令包起来。
- 丰富的特性 – Redis 还支持 publish/subscribe, 通知, key 过期等等特性。

#### 配置：

Redis 的配置文件位于 Redis 安装目录下，文件名为 redis.conf(Windows 名为 redis.windows.conf)。你可以通过 CONFIG 命令查看或设置配置项。

#### 数据类型：

##### String（字符串）

key：`name`，value：`"damao"`

```
set name "damao"
```

##### Hash（哈希）

key：`person`，value: `{ name: "damao", age: 13, sex: "fale" }`

```
hmset person name "damao" age 13 sex "fale"
```

##### List（列表）

string 类型的列表，按照插入顺序排序。

key: `name`，value: `["xiaoming", "xiaowang", "xiaotian"]`

```
lpush name "xiaoming"
lpush name "xiaowang"
lpush name "xiaotian"
```

##### Set（集合）

string 类型的无序集合。集合是通过哈希表实现的，所以添加，删除，查找的复杂度都是 O(1)。添加一个 string 元素到 key 对应的 set 集合中，成功返回 1，如果元素已经在集合中返回 0。

key: `color`，value: `{ red, green, yellow }`

```
sadd color "red"
sadd color "green"
sadd color "yellow"
```

##### ZSet（有序集合）

string 类型元素的集合,每个元素都会关联一个 double 类型的分数，通过分数来为集合中的成员进行从小到大的排序。

key: `result`，value: `{ 11, 22, 33 }`

```
zadd result 2 22
zadd result 1 11
zadd result 3 33
```

#### Hyperloglog

基数统计：一个集合（注意：这里集合的含义是 Object 的聚合，可以包含重复元素）中不重复元素的个数。例如集合 {1,2,3,1,2}，它有 5 个元素，但它的基数/Distinct 数为 3。在输入元素的数量或者体积非常大时，计算基数所需的空间总是固定的、并且是很小的。鉴于 HyperLogLog 不保存数据内容的特性，它只适用于一些特定的场景。比如统计有多少 ip 访问服务。

Redis 为 HyperLogLog 提供了三个命令：PFADD、PFCOUNT、PFMERGE。我们依次来看看这三个命令的解释和作用。

##### PFADD

将任意数量的元素添加到指定的 HyperLogLog 里面。时间复杂度： 每添加一个元素的复杂度为 O(1) 。如果 HyperLogLog 估计的近似基数（approximated cardinality）在命令执行之后出现了变化， 那么命令返回 1 ， 否则返回 0 。 如果命令执行时给定的键不存在， 那么程序将先创建一个空的 HyperLogLog 结构， 然后再执行命令。

命令行示例:

```
# 命令格式：PFADD key element [element …]
# 如果给定的键不存在，那么命令会创建一个空的 HyperLogLog，并向客户端返回 1
127.0.0.1:6379> PFADD ip_20190301 "192.168.0.1" "192.168.0.2" "192.168.0.3"
(integer) 1
# 元素估计数量没有变化，返回 0（因为 192.168.0.1 已经存在）
127.0.0.1:6379> PFADD ip_20190301 "192.168.0.1"
(integer) 0
# 添加一个不存在的元素，返回 1。注意，此时 HyperLogLog 内部存储会被更新，因为要记录新元素
127.0.0.1:6379> PFADD ip_20190301 "192.168.0.4"
(integer) 1
```

##### PFCOUNT

当 PFCOUNT key [key …] 命令作用于单个键时，返回储存在给定键的 HyperLogLog 的近似基数，如果键不存在，那么返回 0，复杂度为 O(1)，并且具有非常低的平均常数时间；

当 PFCOUNT key [key …] 命令作用于多个键时，返回所有给定 HyperLogLog 的并集的近似基数，这个近似基数是通过将所有给定 HyperLogLog 合并至一个临时 HyperLogLog 来计算得出的，复杂度为 O(N)，常数时间也比处理单个 HyperLogLog 时要大得多。

命令行示例:

```
# 返回 ip_20190301 包含的唯一元素的近似数量
127.0.0.1:6379> PFCOUNT ip_20190301
(integer) 4
127.0.0.1:6379> PFADD ip_20190301 "192.168.0.5"
(integer) 1
127.0.0.1:6379> PFCOUNT ip_20190301
(integer) 5
127.0.0.1:6379> PFADD ip_20190302 "192.168.0.1" "192.168.0.6" "192.168.0.7"
(integer) 1
# 返回 ip_20190301 和 ip_20190302 包含的唯一元素的近似数量
127.0.0.1:6379> PFCOUNT ip_20190301 ip_20190302
(integer) 7
```

##### PFMERGE

将多个 HyperLogLog 合并（merge）为一个 HyperLogLog，合并后的 HyperLogLog 的基数接近于所有输入 HyperLogLog 的可见集合（observed set）的并集。时间复杂度是 O(N)，其中 N 为被合并的 HyperLogLog 数量，不过这个命令的常数复杂度比较高。

命令格式：PFMERGE destkey sourcekey [sourcekey …]，合并得出的 HyperLogLog 会被储存在 destkey 键里面，如果该键并不存在，那么命令在执行之前，会先为该键创建一个空的 HyperLogLog。

命令行示例:

```
# ip_2019030102 是 ip_20190301 与 ip_20190302 并集
127.0.0.1:6379> PFMERGE ip_2019030102 ip_20190301 ip_20190302
OK
127.0.0.1:6379> PFCOUNT ip_2019030102
(integer) 7
```

#### 事务

Redis 事务可以一次执行多个命令， 并且带有以下三个重要的保证：

- 批量操作在发送 EXEC 命令前被放入队列缓存。
- 收到 EXEC 命令后进入事务执行，事务中任意命令执行失败，其余的命令依然被执行。
- 在事务执行过程，其他客户端提交的命令请求不会插入到事务执行命令序列中。

一个事务从开始到执行会经历以下三个阶段：

1. 开始事务。
2. 命令入队。
3. 执行事务。

#### 发布订阅

Redis 发布订阅 (pub/sub) 是一种消息通信模式：发送者 (pub) 发送消息，订阅者 (sub) 接收消息。

Redis 客户端可以订阅任意数量的频道。

#### stream

主要用于消息队列（MQ，Message Queue），Redis 本身是有一个 Redis 发布订阅 (pub/sub) 来实现消息队列的功能，但它有个缺点就是消息无法持久化，如果出现网络断开、Redis 宕机等，消息就会被丢弃。Redis Stream 提供了消息的持久化和主备复制功能，可以让任何客户端访问任何时刻的数据，并且能记住每一个客户端的访问位置，还能保证消息不丢失。

满足了消息队列具备的全部内容，包括但不限于：

消息 ID 的序列化生成
消息遍历
消息的阻塞和非阻塞读取
消息的分组消费
未完成消息的处理
消息队列监控

#### GEO

Redis GEO 主要用于存储地理位置信息，并对存储的信息进行操作

> 一个 Redis 实例提供了多个用来存储数据的字典,不同的应用应该使用不同的 Redis 实例存储数据。

### nodejs 中使用 redis

#### 安装

```
npm install redis --save
```

#### 连接

```javascript
var redis = require("redis");
var client = redis.createClient(6379, "127.0.0.1");
// client.auth(123456); // 默认没有密码
client.on("connect", function() {
  // set 语法
  client.set("name", "long", function(err, data) {
    console.log(data);
  });
  // get 语法
  client.get("name", function(err, data) {
    console.log(data);
  });

  client.lpush("class", 1, function(err, data) {
    console.log(data);
  });

  client.lrange("class", 0, -1, function(err, data) {
    console.log(data);
  });
});
```
