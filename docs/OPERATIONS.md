# 操作手册 / Operations

本文件记录仓库级的标准维护、恢复和 Cloudflare 专项流程。具体平台操作优先阅读各子目录自己的 docs。

## 1. 标准 GitHub 维护流程

每次实际修改：

1. 确认仓库 `jax2333333/proxy-configs`，正式分支 `main`。
2. 读取根 `README.md` 和 `docs/KNOWLEDGE-INDEX.md`。
3. 读取 `AGENTS.md` 与目标子项目 README。
4. **重新读取 `main` 最新目标文件。**
5. 只做当前任务所需的最小修改。
6. 检查语法、引用、规则顺序和敏感信息。
7. 查看差异。
8. 用户已明确授权提交时才 commit/push；否则按 `AGENTS.md` 执行。
9. 提交后重新读取 GitHub 实际文件，确认内容真正写入。
10. 汇报文件、目的、验证、风险、commit。

如果发现 `main` 在读取后又发生变化，重新读取目标文件再修改，不拿旧 blob/旧聊天直接覆盖。

## 2. 新设备 / 新对话恢复

新 ChatGPT：使用根 README 顶部最短接管提示词。

新客户端设备：

- Shadowrocket：按 `shadowrocket/README.md` / `shadowrocket/docs/OPERATIONS.md`；
- Clash Verge：按 `clash-verge/docs/INSTALL-AND-RECOVERY.md`，恢复 GitHub 模板后再恢复本地 Merge；
- OpenClash：按 `openclash/docs/OPERATIONS.md`，GitHub YAML + R2S 本地 Provider 覆写分离恢复；
- Cloudflare v2：按 `cloudflare-node/edgetunnel-v2/DEPLOY.md`。

不要把本地真实订阅或 Secret 为了“方便恢复”提交 Public GitHub。

## 3. Cloudflare v2 从零部署

正式细节以 `cloudflare-node/edgetunnel-v2/DEPLOY.md` 为准。长期流程：

```text
Cloudflare Pages
→ 连接 GitHub proxy-configs
→ Root: cloudflare-node/edgetunnel-v2
→ Build: node sync-upstream.mjs
→ Output: dist
→ Production: main
```

部署后在 Cloudflare Production 环境配置：

- `ADMIN`：Secret；
- `UUID`：Secret；
- `KEY`：Secret；
- `OFF_LOG=1`；
- `DEBUG` 默认不设置；
- KV namespace 绑定变量名固定为 `KV`。

这些值不写 GitHub。

验证顺序：

1. Pages 部署成功；
2. 根路径正常返回伪装页；
3. login/admin 可访问；
4. 面板能生成 VLESS / 订阅；
5. 客户端基础连接；
6. Google / GitHub / YouTube；
7. ChatGPT / Cloudflare 托管站点；
8. 再做 CF 优选。

## 4. Cloudflare IP 本地优选

适合 Windows 10 的已验证工具：CFData-WEB。

原则：优选测的是**当前本地网络 → Cloudflare**，因此应尽量在不经过其它代理的本地网络环境测试。

推荐流程：

1. 启动 CFData-WEB 本地程序，浏览器访问其 localhost Web UI。
2. 先做“官方优选”。
3. IPv4 优先；测试端口优先使用当前正式节点实际支持且兼容性好的 HTTPS 端口，通常先测 443。
4. 扫描方式先用 TCPing；同一种扫描模式内比较结果。
5. 测速源可对比“自动选择”和当前运营商专项源。
6. 为避免多个 IP 抢带宽，真实吞吐验证时测速线程优先设为 1。
7. 保留少量 3～5 个候选，不要把几百个结果全塞进订阅。
8. 优先选择：0% 丢包、平均延迟稳定、实际下载速度明显较高的结果。
9. 再在真实客户端用同一 YouTube 4K60 视频或其它大流量目标复测。

不要只根据 ping 选最终节点。实际吞吐、Buffer Health、丢包和长期稳定性更重要。

## 5. 把优选 IP 用到 edgetunnel

核心关系：

```text
server = CF 优选 IP / 优选域名
port   = 对应 HTTPS 端口
Host   = 实际自定义域名
SNI    = 实际自定义域名
UUID   = Cloudflare Secret 中的当前值
Path   = 面板当前生成值
TLS    = 开启
```

**只替换入口 `server`，不要把 Host/SNI 改成 IP。**

推荐把候选加入 edgetunnel 自定义优选列表，刷新客户端订阅，再逐个实测。名称建议只表达地区和序号，不把秘密写入备注。

## 6. 不开 Clash 访问 edgetunnel 后台

如果中国大陆直连默认 Cloudflare 路径打不开后台，但又需要关闭 Clash 做本地优选：

### 最省事：SwitchHosts / Hosts 临时覆写

把一个已经验证可直连的 CF 优选 IP 临时映射到当前后台域名：

```text
<GOOD_CF_IP>    <CURRENT_ADMIN_DOMAIN>
```

然后关闭 Clash 系统代理，浏览器仍访问原 HTTPS 域名。这样 Host/SNI 保持原域名，底层入口被固定到已验证 IP。

长期可选：在 R2S / dnsmasq 做局域网本地 DNS 覆写。

安全规则：

- 实际域名/IP 映射属于运行环境资料，不需要提交 Public GitHub；
- 优选 IP 失效时换下一条候选；
- 不关闭 TLS 证书验证来绕过问题。

## 7. Cloudflare v2 上游更新

不要在 Cloudflare Dashboard 里手工替换 `_worker.js` 作为长期维护方式。

正式更新：

1. 读取 `cloudflare-node/edgetunnel-v2/UPSTREAM.md` 当前 pin；
2. 查看上游最新 release / changelog / `_worker.js`；
3. 检查 ADMIN、KV、ProxyIP、订阅、链式出站、日志等兼容变化；
4. 计算/确认新文件 Git blob SHA；
5. 同时更新 `sync-upstream.mjs` 的 commit + blob 校验值；
6. 更新 `UPSTREAM.md`；
7. Preview/Test 部署；
8. 验证后台、Clash Verge、Shadowrocket、Google/YouTube/ChatGPT；
9. 再升级生产；
10. 有问题立即回退到 Pages 历史部署或旧 pin。

不要因为上游 `main` 更新就自动跟随。

## 8. Cloudflare 回滚

优先级：

1. Cloudflare Pages 部署历史回滚到上一已验证版本；
2. GitHub 回退 edgetunnel pin 到上一已验证 commit/blob；
3. 必要时使用 v1 自写 Worker 做协议基线和故障隔离。

回滚后重新验证入口、后台、客户端和目标网站，不要仅以“部署成功”判断恢复完成。

## 9. 三客户端同步原则

只有用户明确要求“同步更新三套配置”时才跨目录修改。

同步时先抽象“策略意图”，例如 Apple 直连、AI 独立、TikTok 地区策略、DNS 防泄漏，再分别转换为：

- Shadowrocket conf/module 语法；
- Clash Verge / Mihomo YAML；
- OpenClash / Mihomo YAML 与路由器运行约束。

不复制无法等价的字段。
