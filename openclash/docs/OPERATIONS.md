# OpenClash 日常操作与恢复

本文记录“怎么做”，不作为当前配置副本。Provider、端口、组名等实际值以 `main` 最新 YAML 为准。

## 1. R2S 使用 GitHub 正式配置

OpenClash 配置订阅应指向：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_v5.yaml
```

LuCI 中进入：`服务 → OpenClash → 配置订阅`，确认订阅地址是上面的 Raw 地址，然后保存并更新配置。

旧 Gist 曾导致“GitHub 已更新但 R2S 仍拉到旧版本”。以后不把 Gist 当正式源。

## 2. 本地真实机场订阅

真实机场订阅地址不得写入 GitHub。R2S 使用运行状态页顶部的“覆写模块”创建/维护本地 `local-airport.txt`。

入口：`服务 → OpenClash → 运行状态 → 顶部「覆写模块」`。

覆写文件必须有段头。当前三 Provider 的本地模板：

```ini
[YAML]
proxy-providers:
  Airport1:
    url: "真实订阅地址 1"

  Airport2:
    url: "真实订阅地址 2"

  Airport3:
    url: "真实订阅地址 3"
```

这三个真实 URL 只存在路由器本地。不要把这个文件原样上传仓库、Issue、公开聊天或截图。

## 3. 为什么本地只写 URL

GitHub 正式 YAML 已为每个 Provider 定义完整骨架，例如：

```yaml
AirportX:
  url: "https://example.com/airportX.yaml"
  type: http
  interval: 86400
  health-check:
    enable: true
    url: https://www.gstatic.com/generate_204
    interval: 300
```

OpenClash `[YAML]` 覆写会对 Hash 做深度合并，因此本地可以只覆盖 `url`，其余字段继续沿用 GitHub 正式配置。

**新增 Provider 的正确顺序：**

1. 先读取 GitHub `main` 最新 YAML。
2. 在 GitHub 正式 YAML 中增加完整 Provider 骨架，URL 使用占位地址。
3. 检查其策略组归属和节点前缀。
4. 提交并重新读取 GitHub 验证。
5. R2S 更新 GitHub 配置。
6. 最后在本地 `local-airport.txt` 只新增真实 URL。

如果反过来先在本地新增一个 GitHub 从未定义过的 Provider，而只写 `url`，Mihomo 会因为缺少 `type` 等必填字段而启动失败。这个问题历史上出现过：`parse proxy provider ... has unset fields: type`。

### 3.1 更换既有 Provider URL 时的缓存陷阱

2026-09-04 在 R2S 实机确认：修改 `local-airport.txt` 中已有 `Airport1` / `Airport2` / `Airport3` 的真实订阅 URL 后，运行时 YAML 已成功得到新 URL，但节点仍可能继续来自旧 Provider 缓存。

原因不是订阅被写死在 GitHub，而是 OpenClash 会把 HTTP Provider 的 `path` 规范化为按 Provider 名固定的本地路径（例如 `./proxy_provider/<Provider名>.yaml`；不同版本运行时可能去掉扩展名），因此“同名 Provider 换 URL”仍可能复用 `/etc/openclash/proxy_provider/<Provider名>` 的旧文件。`health-check.interval` 只负责健康检查，不等同于重新下载订阅。

本次已验证的诊断链：

1. `/etc/openclash/config/<配置名>.yaml` 继续保留 GitHub 占位 URL 是正常现象；不要据此判断覆写失败。
2. 检查 `/etc/openclash/<配置名>.yaml` 的运行时 `proxy-providers`，确认本地覆写已进入运行配置；输出时必须脱敏 URL。
3. 直接从运行时 URL 下载到 `/tmp/<Provider>.fresh`，只比较 HTTP 状态、文件大小、节点数和 SHA256，不回显真实 URL 或节点认证信息。
4. 若新订阅 HTTP 200、YAML 可解析且 SHA256 与 `/etc/openclash/proxy_provider/<Provider>` 不同，即可确认旧 Provider 缓存未更新。
5. 修复时先备份旧缓存，再用新下载文件原位替换对应 Provider，重启 OpenClash；2026-09-04 已验证重启后新 SHA 保持不变，后台重新加载新节点。

不要为了这个问题修改 GitHub 中的占位 URL，也不要无脑删除整个 `proxy_provider/` 目录。

**长期自动化方向：Provider URL 指纹守卫。** 推荐只在 R2S 本地维护，不写入正式 YAML：读取本地 `local-airport.txt` 中各 Provider 的真实 URL，仅保存其 SHA256 指纹；OpenClash 启动时若发现某个 Provider 的 URL 指纹发生变化，只删除该 Provider 的旧缓存，再让 Mihomo 按新 URL 自动拉取。URL 不变时不删缓存。这样既避免每次手工替换，也避免每次重启都清缓存造成不必要的网络依赖。

注意 OpenClash 官方覆写执行顺序：`[Overwrite]` 与 `[YAML]` 都在 OpenClash 自身 `yml_change.sh` / `yml_rules_change.sh` 之后执行，但同一轮中 `[Overwrite]` 先于 `[YAML]`。因此缓存守卫若做成独立 `[Overwrite]` 模块，应直接读取本地私密文件 `/etc/openclash/overwrite/local-airport.txt` 的 URL 来计算指纹，而不能假设此时运行时 YAML 已经完成 `local-airport.txt` 的 `[YAML]` URL 合并。

## 4. GitHub 维护标准流程

任何 OpenClash 配置修改：

1. 重新读取 `main` 当前 `openclash/openclash_by_jax_v5.yaml`，不要用聊天旧副本。
2. 明确这次变更影响的 Provider / 策略组 / DNS / Rules。
3. 只做必要的最小修改。
4. 检查 YAML 语法、缩进、重复键、Provider/组/规则引用。
5. 检查所有机场 URL 仍是占位地址，无敏感信息。
6. 写入 GitHub。
7. **重新读取写后的文件**，确认真实结果。
8. 向用户报告改了哪些文件、验证结果和 commit。
9. R2S 手动/自动更新配置后，再观察 OpenClash 日志。

除非用户明确说“同步更新三套配置”，这个流程只操作 `openclash/`。

## 5. 从零恢复

路由器重装或 OpenClash 配置丢失时：

1. 安装 OpenClash/Mihomo 所需依赖；具体包和版本以 OpenClash 官方指南与当前固件为准，不照抄历史版本。
2. 在“配置订阅”添加本仓库 Raw URL。
3. 更新配置，让占位 Provider YAML 下载到本地。
4. 在“运行状态 → 覆写模块”新建 `local-airport.txt`，第一行写 `[YAML]`，填入本地真实机场 URL。
5. 启用覆写模块并重启 OpenClash。
6. 检查 Provider 是否成功下载、策略组是否出现预期节点。
7. 生成 Debug 日志确认依赖、DNS、路由和防火墙没有异常。
8. 用 ipleak / DNSLeakTest 等检查 DNS、IPv4/IPv6、WebRTC；判断结果时区分代理出口 IPv6 与本地 ISP IPv6。

## 6. 更新后验证重点

更新 Provider / 策略组后至少确认：

- `Airport1` 是否仍只进入主智能/地区/故转逻辑。
- `Airport2`、`Airport3` 是否只进入备用智能和全部节点（除非用户后来明确修改了设计）。
- `🔮 节点选择` 是否包含备用智能选择。
- 其它功能组没有被误加备用组。
- 节点名前缀是否正确，没有同名冲突。
- DNS Strict、Apple、Steam、ZeroTier、browserleaks 等现有规则未被无关改动。

## 7. 配置订阅更新异常

如果 GitHub 已经更新但 R2S 看不到最新版本：

- 先看 YAML 第一行版本注释是否变化。
- 检查 OpenClash“配置订阅”的地址是否仍是旧 Gist。
- 检查运行日志中的下载 URL、curl 错误和 `Config File Tested Faild` 等信息。
- 必要时生成 Debug 日志，不要反复覆盖配置碰运气。

## 8. 覆写模块规则

OpenClash 官方要求覆写模块至少包含 `[General]`、`[Overwrite]`、`[YAML]` 之一，否则整个文件会被跳过。普通静态 YAML 覆写优先使用 `[YAML]`；只有需要动态条件/循环时才考虑 `[Overwrite]`。
