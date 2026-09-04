# OpenClash v6.1 Release State

版本：v6.1
状态：Production Ready

## 正式配置

正式运行文件：

- openclash/openclash_by_jax_v6.1.yaml

## v6.1 架构

核心入口：

- 🔮 节点选择

包含：

- A|智能选择（smart）
- B|智能选择（smart）
- 🇭🇰 A/B 香港智能
- 🇯🇵 A/B 日本智能
- 🇹🇼 A/B 台湾智能
- 🇺🇸 A/B 美国智能
- 🇸🇬 A/B 新加坡智能
- 🖐️ 手动选择
- 🛠️ 节点测速
- 🚀 直连

## 维护设计

节点测速：

- 类型：url-test
- 用于维护、晚高峰测试、节点质量检查
- 不作为普通应用入口

智能选择：

- A/B机场独立 smart
- 地区智能独立维护
- 排除低质量倍率节点规则保留

## 应用策略

AI：

- 使用日本、新加坡、美国、台湾智能
- 排除香港路径

TikTok：

- 节点选择
- 手动选择
- 台湾、新加坡、美国、日本智能

Microsoft / OneDrive：

- 🚀直连优先

## 验证状态

已完成：

- YAML结构检查
- proxy-group引用检查
- rules引用检查
- Smart兼容检查
- url-test检查
- Mihomo/OpenClash运行验证

## 安全边界

禁止提交：

- 真实机场订阅URL
- UUID
- Token
- 密钥
- 密码
- 私人认证信息

正式GitHub配置只保存脱敏配置和知识文档。真实订阅只保存在本地运行环境。