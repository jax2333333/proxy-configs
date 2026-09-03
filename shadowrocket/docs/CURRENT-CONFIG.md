# Current Configuration Rules

> 本文件记录长期约定，不是完整配置副本。版本、字段、规则顺序、策略组和模块清单必须读取 GitHub `main` 的实际文件。

## 正式边界

- 主配置：`shadowrocket/Jax-shadowrocket-v6.conf`
- Toolkit：`shadowrocket/toolkit/`
- 未经明确要求，不修改 OpenClash 或 Clash Verge。

## 长期约定

### DNS / IPv6

主配置长期采用 IPv6 默认关闭、显式 DNS 和 DNS 劫持等设计，但具体服务器、字段和值可变化。每次诊断读取当前 `[General]`；53/UDP 需结合劫持设置、系统解析和实际泄漏测试判断，不为单个 DNS 问题破坏既有分流。

### 路由

- Apple 维持独立策略和既有直连优先设计。
- TikTok 维持独立策略与地区稳定优先；抖音直连规则不能误伤共享域名。
- 国内站点出现 FINAL / 代理异常时，先以日志验证，再考虑最小显式直连补丁。
- 策略组名称视为稳定接口。

### Toolkit

广告和清理功能模块化、可独立关闭；不使用全局 MITM，脚本优先自托管并在解析失败时原样放行。修改模块前读取 `toolkit/README.md`、目标 module/script 与主配置相关规则，避免重复或冲突。

## 修改前检查

读取真实配置后检查 `[General]`、`[Rule]` 顺序、`FINAL`、DNS、IPv6、UDP/QUIC、目标策略组、模块冲突和 MITM hostname 合并方式。
