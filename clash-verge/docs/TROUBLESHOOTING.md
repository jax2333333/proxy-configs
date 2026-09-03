# Clash Verge / Mihomo 故障排查

## 总原则

先判断问题属于：

- 配置语法 / Provider 下载失败
- TUN / 网卡
- DNS
- 节点连接
- 规则匹配
- Clash Verge 本地覆写
- 单个目标服务自身异常

不要只看 warning 数量；**时间分布和是否持续**更重要。

## 1. 日志快速检查

优先搜索：

```text
fatal
panic
level=error
level=warning
interface not found
get empty name
dns resolve failed
i/o timeout
provider
404
```

然后确认：

- 是否只在启动 / 重启瞬间出现。
- 是否在 1～2 秒后恢复正常连接。
- 是否所有站点都失败，还是单一服务失败。
- 是否出现物理接口重新识别日志。

## 2. TUN：`Auto detect interface ... get empty name`

已在 Windows Clash Verge 日志中实际遇到：

```text
[TUN] Auto detect interface for <IP> get empty name.
[TUN] Auto detect interface for <IP> failed, return '<invalid>' to avoid lookback
```

同一时间可能伴随：

```text
connect error: interface not found
```

已验证的判断方式：

### 启动瞬态

如果这些 warning：

- 集中在 Clash Verge / TUN 重启的极短时间窗口；
- 随后出现类似 `default interface changed by monitor, => WLAN` 的有效物理接口；
- 后续数分钟不再持续 warning；
- ChatGPT / Google / GitHub 等重新正常；

则优先视为**网卡切换/路由重建瞬态**，不应仅因为 warning 很多就修改 GitHub 配置。

### 真正故障

如果 `interface not found` 持续数秒甚至更久，并且：

- 浏览器无法联网；
- DNS / DIRECT / 代理节点同时失败；
- 始终没有重新识别物理出口；

再检查：

1. Clash Verge 当前 TUN 状态。
2. Windows / macOS 当前有效网卡。
3. Clash Verge 本地 TUN Override。
4. 是否存在残留/异常虚拟网卡。
5. 最新 Mihomo Issues / Clash Verge Rev 已知问题。

## 3. GitHub YAML 与实际运行值不同

过去日志曾出现：

- GitHub YAML 目标为 `stack: mixed`，实际日志显示 `gVisor`。
- YAML 中的端口与运行日志监听端口不同。

这类现象首先说明：

```text
GitHub YAML
   ↓
Clash Verge 本地设置 / Merge / Override
   ↓
Mihomo 最终运行配置
```

排查顺序：

1. 读 GitHub `main` 最新 YAML。
2. 看 Clash Verge GUI 当前 TUN / 端口设置。
3. 看订阅 Merge / Override。
4. 看启动日志里的最终值。
5. 只有确认 GitHub 本身需要变更后才修改仓库。

## 4. Microsoft 遥测类 Warning

曾观察到：

```text
web.vortex.data.microsoft.com
error: dns resolve failed: couldn't find ip
```

以及：

```text
mobile.events.data.microsoft.com
error: dial tcp ... i/o timeout
```

同时其他 Microsoft 服务（登录、Office、Teams、SharePoint 等）仍可正常直连。

长期判断原则：

- 单一遥测/事件域名失败，不等于整个 DNS 配置失败。
- 如果只有少量、间歇 warning，且 Microsoft 核心服务正常，可先观察。
- 如果 Microsoft 登录、Office、OneDrive 等核心功能也持续失败，再检查 DNS、DIRECT 路由与目标 IP 连通性。

不要为了消除几条遥测 warning，把整个 Microsoft 分组强制改为代理。

## 5. `badjs.weixinbridge.com`

该域名属于微信/WeChat WebView 前端 JavaScript 错误/异常上报体系，可理解为前端错误遥测服务。

处理原则：

- 在日志里看到它本身不代表中毒或代理异常。
- 不要仅因为名字包含 `badjs` 就加入拦截。
- 如果按 CN 规则命中国内直连，一般符合当前分流语义。
- 真正需要阻断遥测时应单独评估副作用，不把它误当广告域名随意封禁。

## 6. DNS 诊断

当前设计是 Fake-IP + 分层 DNS。排查时确认：

- 国内域名是否命中 CN policy。
- 海外 DoH 是否通过代理组连接。
- Provider 节点域名是否能通过 `proxy-server-nameserver` 解析。
- 日志中是否只有单一域名 `dns resolve failed`，还是大面积域名都失败。

如果 Google / GitHub / ChatGPT / 国内站点同时解析失败，才更像系统性 DNS / TUN 问题。

## 7. Rule Provider 404

历史上曾确认以下思路有问题：

- 继续引用不存在的 `apple_ip.mrs`。
- 继续引用不存在的 `steam_ip.mrs`。

当前方案已经移除这些依赖，并使用现存的 MRS 分类。

以后新增/修改 Rule Provider URL 时：

1. 先验证目标 `.mrs` 当前存在。
2. 确认 `behavior` 与文件类型匹配。
3. 再写入 GitHub。
4. 更新后看日志是否还有 Provider 下载失败。

## 8. Steam 分流

当前经过验证的规则意图：

```text
steam@cn
   ↓
📥 Steam 下载

steam 通用域名
   ↓
🎮 Steam 商店
```

国内 Steam 规则必须放在通用 Steam 规则之前，否则更宽泛规则可能提前命中。

## 9. 节点筛选异常

历史上使用大型负向正则时，曾出现裸 `2` 之类条件可能误伤：

```text
JP-02
US-2
2026...
```

当前方案使用：

- `filter`：地区正向筛选。
- `exclude-filter`：免费/倍率/流量提示等排除。
- `include-all-providers`：只从 Provider 池引入机场节点。

如果地区组“少节点”或“没有节点”：

1. 先看机场节点名称。
2. 读最新 YAML 的 `filter`。
3. 读最新 `exclude-filter`。
4. 检查是否被误排除。

不要直接恢复历史的大型负向正则。

## 10. 规则命中基础验证

按当前设计，正常日志应能看到类似语义：

```text
chatgpt.com        → 🤖 AI
github.com         → 🐙 GitHub
www.youtube.com    → 📺 YouTuBe
Google 域名        → 🔮 节点选择
中国大陆域名/IP   → 🇨🇳 国内流量
广告规则          → 🛑 全局拦截
未分类流量        → 🐟 漏网之鱼
```

具体最终节点取决于当前策略组选择。

## 11. 配置语法检查

如果可以直接运行 Mihomo CLI：

```sh
mihomo -t -f <配置文件路径>
```

同时还要检查：

- YAML 解析。
- 重复键。
- 策略组引用。
- Rule Provider 引用。
- Rules 目标组。
- DNS 结构。

## 12. 何时修改 GitHub

只有当确认问题属于**正式配置本身**时才修改仓库。

以下情况通常先不要改 GitHub：

- 重启瞬间网卡尚未识别。
- 单个遥测域名 timeout。
- Clash Verge 本地 Override 改了运行值。
- 机场单节点失效。
- 目标网站自身临时故障。

任何正式修改仍要先重新读取 `main` 最新 YAML。
