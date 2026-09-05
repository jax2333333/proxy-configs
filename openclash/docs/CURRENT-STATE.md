# 当前状态说明

> 本文用于快速理解当前 OpenClash 设计。
>
> 正式配置永远以 `main` 分支中的 YAML 文件为准。

当前正式配置入口：

-   双机场： `openclash/openclash_by_jax_双机场.yaml`

-   单机场： `openclash/openclash_by_jax_单机场.yaml`

若本文与 YAML 不一致，以 GitHub main 中实际 YAML 为准，并同步更新本文。

------------------------------------------------------------------------

# 1. 项目边界

设备侧：

-   R2S
-   ImmortalWrt
-   OpenClash
-   Mihomo

仓库：

`jax2333333/proxy-configs`

OpenClash 维护范围：

`openclash/`

除非明确要求同步修改，否则不联动修改：

-   Clash Verge
-   Shadowrocket

------------------------------------------------------------------------

# 2. 配置入口

## 双机场配置

文件：

`openclash/openclash_by_jax_双机场.yaml`

适用：

-   两个机场订阅
-   主备机场组合
-   A/B节点隔离管理

Provider：

-   Airport-A
-   Airport-B

节点前缀：

-   A\|
-   B\|

------------------------------------------------------------------------

## 单机场配置

文件：

`openclash/openclash_by_jax_单机场.yaml`

适用：

-   单机场用户
-   简化策略
-   降低维护复杂度

Provider：

-   Airport-A

特点：

-   删除 Airport-B
-   删除 B\|体系
-   使用统一智能选择

------------------------------------------------------------------------

# 3. Provider安全规则

GitHub公开仓库允许：

-   Provider名称
-   配置结构
-   占位URL

禁止：

-   真实机场订阅URL
-   UUID
-   Token
-   密钥
-   密码

真实订阅只保存在本地私密覆写文件。

GitHub只保存：

`url: XXXXXXXXX`

------------------------------------------------------------------------

# 4. DNS / Fake-IP设计

长期设计：

-   ipv6: false
-   dns.enhanced-mode: fake-ip
-   Fake-IP范围：198.18.0.1/16
-   respect-rules: true

原则：

-   境外服务使用海外加密DNS
-   国内域名使用国内DoH
-   proxy-server-nameserver避免解析死循环
-   保留private_domain和cn_domain

DNS检测相关域名保持海外解析优先：

-   browserleaks.com
-   browserleaks.net
-   whoami.akamai.net
-   whatismyip.akamai.com
-   surfshark.com

------------------------------------------------------------------------

# 5. 应用策略

保留独立策略：

-   🤖 AI
-   📺 YouTube
-   ✈️ Telegram
-   🐙 GitHub
-   🍎 Apple
-   💻 Microsoft
-   ☁️ OneDrive
-   🎬 Netflix
-   🎵 TikTok
-   🎮 Steam
-   🐟 漏网之鱼

------------------------------------------------------------------------

# 6. Smart设计

双机场：

-   A/B地区Smart独立
-   统一智能入口

单机场：

-   Airport-A Smart
-   地区智能入口

Smart原则：

排除：

-   免费节点
-   0.01倍率
-   x0.1倍率

Smart参数：

-   uselightgbm
-   collectdata
-   interval
-   tolerance

必须读取当前YAML，不在文档锁死。

------------------------------------------------------------------------

# 7. Provider缓存保护

维护工具：

`provider-cache-guard-v3.1.3.1.sh`

功能：

-   SHA256检测
-   Provider变化检测
-   节点数量检测
-   小文件保护
-   自动备份
-   自动清理缓存

用于解决：

OpenClash Provider缓存未及时更新问题。

------------------------------------------------------------------------

# 8. 配置选择

两个机场：

使用：

`openclash_by_jax_双机场.yaml`

一个机场：

使用：

`openclash_by_jax_单机场.yaml`

------------------------------------------------------------------------

# 9. 修改原则

所有修改必须：

1.  main是唯一正式版本。
2.  修改前读取GitHub最新文件。
3.  不根据旧聊天内容覆盖。
4.  不提交真实机场信息。
5.  默认只修改openclash目录。
6.  YAML变化后同步更新知识库。

------------------------------------------------------------------------

# 10. 未完成问题

Hysteria2测速异常：

历史出现测速无速度。

后续处理：

不要直接修改配置。

先检查：

-   OpenClash Debug日志
-   QUIC
-   UDP路径
-   GSO
-   节点参数
-   核心错误日志
