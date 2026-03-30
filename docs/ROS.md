---
sidebar_position: 6
title: ROS
description: ROS1、ROS2
---

# Ros
## 什么是ros
- **ROS (Robot Operating System)** 是一个运行在Linux上的机器人操作系统（框架）；ros提供了一系列库和工具，以帮助创建机器人应用程序；
- 虽然叫操作系统，本质是一个运行在Linux系统上的中间件；

## 主要特性
- 模块化架构（Node）：具有模块化架构，允许开发人员通过组合称为节点（node）的较小、可重用组件来构建复杂的系统。每个节点通常执行特定的功能，节点之间使用<mark style={{background: '#FFF3A3A6'}}>主题</mark>或<mark style={{background: '#FFF3A3A6'}}>服务</mark> 通过消息进行通信。 
- Topic（话题）：
	- 特点：异步、单项；
	- 使用场景：传感器定频向外广播数据；
- Service（服务）：
	- 特点：同步、双向；
	- 使用场景：服务接口调用，要求拿到返回值；
- Message（消息）：标准消息格式；
	- ROS 定义了标准的消息格式（`.msg`）；
- ROS生态：
	- 工具和实用程序：ROS 配备了一套丰富的工具和实用程序，用于可视化、调试和仿真。例如，RViz 用于可视化传感器数据和机器人状态信息，而 Gazebo 提供了一个强大的仿真环境，用于测试算法和机器人设计。

## Ros1 vs Ros2
- <mark style={{background: '#FFB8EBA6'}}>Ros1有中心节点（Master），Ros2没有；</mark>

|**特性**|**ROS 1 (Centralized)**|**ROS 2 (Decentralized)**|
|---|---|---|
|**管理者**|**ROS Master (roscore)**：所有节点必须向它注册。|**无 Master**：节点通过内置发现机制寻找彼此。|
|**单点故障**|**致命**：Master 挂了，整个系统通讯立即瘫痪。|**高可用**：任意节点挂掉不影响其他节点通讯。|
|**通讯协议**|自研的 **TCPROS/UDPROS**（应用层协议）。|工业级标准 **DDS (Data Distribution Service)**。|
|**发现机制**|强依赖 Master 的 XML-RPC 映射。|基于 DDS 的 **RTPS** 自动发现（类似投影仪自动投屏）。|
- <mark style={{background: '#FFB8EBA6'}}>Ros2有Qos（通信质量）支持策略</mark>；
	- Ros 2的Qos是一组策略，最常用的条目有：
	- **History (历史记录)**：决定了在发送/接收队列中缓存多少条数据。`Keep last`：仅保留最近的 $N$ 条数据（配合 depth 使用）。这是最常用的，防止内存溢出。`Keep all`：保留所有数据，直到资源耗尽（存在风险，慎用）。
	- **Reliability (可靠性)**: 决定了底层 DDS 是否保证数据到达。`Reliable`：类似 TCP。如果丢包，DDS 会尝试重传。适用于控制指令。`Best Effort`：类似 UDP。只管发，不保证一定收到。适用于高频传感器数据。
	- **Durability (持久性)**: 决定了“晚到的订阅者”能否看到历史信息。`Volatile (挥发性)`：订阅者只能收到加入之后的数据。`Transient Local (瞬态本地)`：发送者会为新订阅者保存并重发最近的 $N$ 条历史数据。非常适合保存“机器人当前状态”或“地图信息”。
	- **Liveliness (活跃度)** :用于监控节点的健康状态。`Automatic`：只要有一个节点在发数据，系统就认为它活在。`Manual by Topic`：节点必须手动确认自己还活着，否则系统会触发断连回调。
构造基于Ros2的Publisher或Subscriber时需要传入`rclcpp::QoS` 对象：

```CPP
// 1. 定义一个适合雷达数据的 QoS (高频、允许丢包、不存历史)
auto sensor_qos = rclcpp::QoS(rclcpp::KeepLast(10));
sensor_qos.best_effort();
sensor_qos.durability_volatile();

// 2. 定义一个适合控制指令的 QoS (可靠、必须到达、保存最后一条状态)
auto cmd_qos = rclcpp::QoS(rclcpp::KeepLast(1));
cmd_qos.reliable();
cmd_qos.transient_local();

// 3. 使用 QoS 创建发布者
auto pub = this->create_publisher<std_msgs::msg::String>("topic", cmd_qos);
```

<mark style={{background: '#FFB8EBA6'}}>注意：如果发布者 (Pub) 和订阅者 (Sub) 的 QoS 设置不匹配，它们虽然能“发现”彼此，但永远无法建立通讯。</mark>匹配原则遵循 **“订阅者的要求不能高于发布者的承诺”**；

可靠性排序：

Reliable  > Best Effort

Transient Local > Volatile