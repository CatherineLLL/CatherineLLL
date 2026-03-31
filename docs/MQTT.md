---
sidebar_position: 5
title: MQTT
description: MQTT协议笔记
---

# MQTT
- MQTT：Message Queuing Telemetry Transport，消息队列遥测传输协议
- 传输层是基于TCP/IP协议；
## 核心架构
- 发布/订阅模型；
- 发送者和接收者通过代理（Broker）进行消息中转；
	- **发布者 (Publisher)**：负责发送消息的设备。它将消息发布到特定的“主题（Topic）”。
	- **订阅者 (Subscriber)**：负责接收消息的设备。它向 Broker 订阅感兴趣的“主题”。
	- **代理 (Broker)**：服务端。负责接收发布者的消息，并根据主题将其转发给所有已订阅该主题的订阅者。
## 关键概念
- 主题（Topic)：主题是消息的路由依据；
- Qos（服务质量）：

| **QoS 等级** | **名称**               | **描述**           | **特点**          |
| ---------- | -------------------- | ---------------- | --------------- |
| **QoS 0**  | 最多一次 (At most once)  | 消息只发一次，不保证到达。    | 最省资源，可能丢包。      |
| **QoS 1**  | 至少一次 (At least once) | 确保消息到达，但可能会重复收到。 | 常用，需确认应答。       |
| **QoS 2**  | 只有一次 (Exactly once)  | 确保消息到达且仅到达一次。    | 开销最高，用于金融或严苛场景。 |
## 保留消息
- publish时将retain标志设置为true时，broker除了把消息发给订阅者，还会专门存储一份副本在对应的topic下，每当有新的客户端订阅这个topic时，broker会把存底的那条消息推给它；

## MQTT控制数据报组成
| **组成部分**                   | **长度**   | **是否必须** | **说明**                                     |
| -------------------------- | -------- | -------- | ------------------------------------------ |
| **固定报头 (Fixed Header)**    | 2 ~ 5 字节 | **必须**   | 包含报文类型（如 PUBLISH）、标志位（如 Retain、QoS）以及剩余长度。 |
| **可变报头 (Variable Header)** | 视类型而定    | 可选       | 包含报文标识符、主题名或 MQTT 5.0 的属性等。并不是所有报文都有。      |
| **有效载荷 (Payload)**         | 视数据而定    | 可选       | 实际发送的内容（如传感器数据、JSON）。心跳包（PINGREQ）等不含载荷。    |
## MQTT控制报类型
|**十进制值**|**报文名称**|**传输方向**|**描述**|
|---|---|---|---|
|**1**|**CONNECT**|Client → Server|客户端请求连接服务端。|
|**2**|**CONNACK**|Server → Client|连接确认。|
|**3**|**PUBLISH**|双向|发布消息。|
|**4**|**PUBACK**|双向|发布确认（针对 QoS 1）。|
|**5**|**PUBREC**|双向|发布收到（QoS 2 握手第 1 步）。|
|**6**|**PUBREL**|双向|发布释放（QoS 2 握手第 2 步）。|
|**7**|**PUBCOMP**|双向|发布完成（QoS 2 握手第 3 步）。|
|**8**|**SUBSCRIBE**|Client → Server|客户端订阅主题。|
|**9**|**SUBACK**|Server → Client|订阅确认。|
|**10**|**UNSUBSCRIBE**|Client → Server|客户端取消订阅。|
|**11**|**UNSUBACK**|Server → Client|取消订阅确认。|
|**12**|**PINGREQ**|Client → Server|心跳请求（Ping）。|
|**13**|**PINGRESP**|Server → Client|心跳响应（Pong）。|
|**14**|**DISCONNECT**|双向|断开连接（5.0 中支持服务端主动发）。|
|**15**|**AUTH**|双向|**(仅 5.0)** 增强型认证交换报文。|
## qos1和qos2可靠性保障
| **特性**   | **QoS 1**                  | **QoS 2**               |
| -------- | -------------------------- | ----------------------- |
| **保障级别** | 保证到达，可能重复。                 | 保证到达，绝不重复。              |
| **交互次数** | 2 次报文交换。                   | 4 次报文交换。                |
| **带宽消耗** | 较低。                        | 较高。                     |
| **适用场景** | 传感器数据采集（丢一两个点没关系，重复了也无所谓）。 | 指令下发、金融交易（绝对不能执行两次的操作）。 |
### qos1
- 至少到达一次（可能有重复）；
- 两次握手；
- 发送方持续充传，直到收到确认；

```mermaid
sequenceDiagram
    participant S as 发送方 (Sender)
    participant B as 代理/接收方 (Broker/Receiver)

    S->>B: PUBLISH (Packet ID = 101, DUP = 0)
    Note over B: 存储消息并分发
    B-->>S: PUBACK (Packet ID = 101)
    Note over S: 删除本地缓存
```
### qos2
- 仅送达一次
- 四次握手
```mermaid
sequenceDiagram
    participant S as 发送方 (Sender)
    participant B as 代理/接收方 (Broker/Receiver)

    Note over S,B: 第一阶段：确认收到
    S->>B: PUBLISH (Packet ID = 202)
    Note over B: 记录 Packet ID (锁定)
    B-->>S: PUBREC (Packet ID = 202)

    Note over S,B: 第二阶段：确认释放
    S->>B: PUBREL (Packet ID = 202)
    Note over B: 分发消息给订阅者
    B-->>S: PUBCOMP (Packet ID = 202)
    Note over S: 清理发送队列
```

## MQTT四次握手和TCP三次握手的区别
- 它们不是OSI模型同层的协议

|**特性**|**TCP 三次握手**|**MQTT QoS 握手 (以 QoS 2 为例)**|
|---|---|---|
|**所属层级**|传输层 (Layer 4)|应用层 (Layer 7)|
|**目的**|**建立连接**：确保双方都准备好收发二进制流。|**确认业务**：确保一条特定的“消息”被准确处理。|
|**频率**|**一次性**：每个长连接通常只在开始时握手一次。|**高频**：每发布一条 QoS 2 消息，都要握手四次。|
|**颗粒度**|**字节流**：只管把 0 和 1 发过去，不关心数据代表什么。|**消息体**：关心的是这一条完整的 JSON 或指令是否送达。|
- TCP握手只是保证可以把数据发送到对方主机的网卡
- MQTT握手是应用层可以收到并业务上处理请求；

## 为什么物联网适合使用MQTT
- **开销极小**：最小的数据包报文头仅为 2 字节，非常节省流量和电量。
- **双向通信**：设备既可以上传数据（发布），也可以接收控制指令（订阅）。
- **解耦性强**：发布者和订阅者不需要知道对方的 IP，甚至不需要同时在线。
- **实时性强**：采用长连接，延迟远低于频繁建立连接的 HTTP。

## MQTT利用发布订阅模式支持client/server
- MQTT5.0引入了请求/响应特性；
- 通过请求topic和响应topic来模拟请求/响应模式；
- 过程：（1）发送方在发送请求时会告知接收方将response发送到某个固定的响应地址；（2）接收方收到请求后将回复发送至目标响应topic；

## MQTT鉴权设计
### 传输层加密和应用层鉴权的区别

| **特性**   | **传输层TLS 加密 (Transport Layer)** | **应用层鉴权 (Application Layer)**  |
| -------- | ------------------------------- | ------------------------------ |
| **主要目的** | **防窃听、防篡改、验证服务器**。              | **识别客户端身份、分配权限 (ACL)**。        |
| **工作时机** | TCP 三次握手之后，MQTT 报文发送之前。         | MQTT `CONNECT` 报文到达 Broker 之后。 |
| **可见性**  | 对应用层透明。数据流到达 MQTT 逻辑前已解密。       | 业务逻辑可见。Broker 会提取用户名、ID 进行校验。  |
| **典型手段** | 数字证书 (CA)、RSA/ECC 密钥交换。         | 用户名/密码、JWT、Client ID 绑定。       |
| **性能开销** | **较高**。握手时涉及复杂计算，增加连接延迟。        | **较低**。通常是查库或校验 Token。         |
### 单项tls和双向tls的区别
|**特性**|**单向 TLS (Standard TLS)**|**双向 TLS (mTLS)**|
|---|---|---|
|**谁验证谁**|客户端验证服务器|双方互相验证|
|**服务器证书**|必须提供|必须提供|
|**客户端证书**|不需要|**必须提供**|
|**安全性**|防止连接到假服务器（钓鱼）|既防假服务器，也防非法设备接入|
|**应用场景**|浏览器访问网页、公开 API|机器人集群、金融接口、内部微服务|

### 双向tls（mtls）握手流程
```mermaid

sequenceDiagram
    participant C as 客户端 (Robot/Client)
    participant S as 服务端 (MQTT Broker/Server)

    Note over C, S: === TCP 三次握手已完成 ===

    rect rgb(240, 240, 240)
    Note over C, S: TLS 握手阶段 1：打招呼与服务器认证
    C->>S: 1. Client Hello (支持的算法、随机数R1)
    S-->>C: 2. Server Hello (选定算法、随机数R2)
    S-->>C: 3. Server Certificate (服务端证书)
    end

    rect rgb(200, 230, 255)
    Note over C, S: TLS 握手阶段 2：双向认证的核心 (mTLS 特有)
    S-->>C: 4. Certificate Request (要求客户端出示证书)
    S-->>C: 5. Server Hello Done
    Note over C: 验证服务端证书 (检查 CA 签发机构)
    C->>S: 6. Client Certificate (客户端证书)
    C->>S: 7. Client Key Exchange (加密的预主密钥)
    C->>S: 8. Certificate Verify (使用客户端私钥对握手信息签名)
    end

    rect rgb(240, 240, 240)
    Note over C, S: TLS 握手阶段 3：切换加密并完成
    Note over S: 验证客户端证书 & 验证签名 (步骤 8)
    C->>S: 9. [Change Cipher Spec] & Finished
    S-->>C: 10. [Change Cipher Spec] & Finished
    end

    Note over C, S: === 双向加密通道已建立 (开始发送 MQTT CONNECT) ===
```

Certificate Verify (步骤 8)：**这是整个 mTLS 的安全灵魂。** 仅仅把客户端证书（公钥）发给服务器是不够的，因为任何人都可以持有你的公钥。 客户端必须发送 `Certificate Verify` 报文，里面包含了一段用**客户端私钥**加密的签名数据。服务端通过客户端证书里的公钥解开它，从而证明：“这个客户端不仅拥有这张证书，还确实拥有配套的私钥。”

### mtls的好处
- 提升身份伪造的难度：在 MQTT 鉴权中，如果只用“用户名/密码”，一旦密码泄露，任何人都可以冒充机器人。而 mTLS 要求必须拥有硬件中存储的 **私钥**。私钥通常存储在加密芯片（如 TPM 或网关的安全模块）中，极难被提取。
- 简化证书吊销管理：如果一个机器人被偷了，可以直接在服务器端的 **CRL (证书吊销列表)** 中撤销该设备的证书。这样，即便知道连线协议和密码，该设备也无法再通过 TLS 握手。

### mtls的局限
每次握手都要进行非对称加密运算，会带来**性能开销**；
- 优化建议：利用 **TLS Session Resumption (会话恢复)**。一旦第一次握手成功，后续短时间内的重连可以使用简化的握手流程，避免重复校验物理证书。

### mqtt应用层鉴权及授权
- 应用层鉴权：验证client的身份；
- 主要发生在`CONNECT` 报文阶段；
- 核心流程：CONNECT 报文中的身份信息：
- 在 MQTT 协议中，应用层鉴权通常依赖于 `CONNECT` 控制报文中的三个关键字段：
	- **Client ID**：设备的唯一标识（如机器人的序列号 `SN_123456`）。
	- **Username**：用户名。
	- **Password**：密码（通常是 Token、签名或哈希值）。

```mermaid
sequenceDiagram
    participant C as 机器人 (Client)
    participant B as MQTT Broker (Server)
    participant AS as 认证服务 (Auth Service/DB)

    Note over C, B: TLS 隧道已建立 (加密传输)
    C->>B: 1. 发送 CONNECT (ClientID, Username, Password)
    B->>AS: 2. 校验身份：这台机器合法吗？
    AS-->>B: 3. 返回结果 (Allow / Deny)
    
    alt 验证成功
        B-->>C: 4. 返回 CONNACK (Reason Code: 0x00)
        Note over C, B: 连接成功，开始 Pub/Sub
    else 验证失败
        B-->>C: 4. 返回 CONNACK (Reason Code: 0x86/0x8D)
        B-->>C: 5. 强制断开 TCP 连接
    end
```

- 授权：定义机器人权限范围
#### 典型鉴权方案
- 静态用户名和密码；服务端校验本地存储的password，匹配则通过；
	- 缺点：安全性极低；
- 一机一密：基于 HMAC 的动态签名 (One-Device-One-Secret)。
	- **设计逻辑**：每个机器人出厂时分配一个唯一的 `DeviceSecret`（不在线上传输）。连接时，机器人根据特定算法计算出一个**动态签名**作为密码。
	- **计算过程**：机器人将 `ClientID` 和当前时间戳拼接，使用 `DeviceSecret` 进行 $HMAC\_SHA256$ 运算。
	- **客户端发送**：`Password = HMAC_SHA256("SN_9527" + Timestamp, DeviceSecret)`。
	- **服务端校验**：Broker 拿到密码后，用后台存储的该设备 `DeviceSecret` 重算一遍，一致则放行。
	- 优点：**密码不在网络上传输**，即便截获了单次连接的密码，由于包含时间戳，该密码很快就会失效（防重放攻击）。
- 动态token：
	- **设计逻辑**：机器人不直接连 MQTT，而是先通过 HTTPS 访问你的“认证中心”获取一个短期有效的 Token。
	- **具体案例**：
		1. **第一步**：机器人请求 `https://api.yourcorp.com/v1/login`。
		2. **第二步**：服务器返回一个加密 Token：`eyJhbGciOiJIUzI1NiIsInR5cCI6...`。
		3. **第三步**：机器人连接 MQTT，将该 Token 填入 `Password` 字段。
	- **服务端校验**：Broker 只需通过公钥解密 Token 即可完成验证；
	- 优点：支持权限细分（Scope），且 Token 过期自动失效，方便与业务系统集成。

#### 授权（ACL）
- publish和subscrib权限控制；一般情况下机器人A不允许订阅机器人B的主题；


