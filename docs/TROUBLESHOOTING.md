# 故障排查 / Troubleshooting

原则：先确定故障发生在哪一层，再改配置。不要看到“不能上网”就同时改 DNS、协议、ProxyIP、规则和客户端。

## 1. 分层判断

建议按以下顺序：

```text
DNS 解析
→ TCP 到入口
→ TLS
→ WebSocket / 传输层
→ VLESS / 协议认证
→ Cloudflare Worker/Pages 运行时
→ ProxyIP / 出站
→ 客户端规则 / DNS / TUN
→ 目标网站自身
```

日志里能看到失败层时，优先修该层。

## 2. Mihomo 日志中的 198.18.x.x

`198.18.0.0/15` 常用于 Mihomo Fake-IP。看到：

```text
198.18.x.x:xxxx --> example.com:443
```

通常只是本地 Fake-IP 映射，不代表访问到了公网保留地址，也不是故障证据。

## 3. Cloudflare 默认域名解析到异常 IP

历史上 v1 `workers.dev` 曾出现：域名解析到与 Cloudflare 不符的地址并 `i/o timeout`。

判断：

- 客户端日志直接显示 `dial tcp <异常IP>:443 timeout`；
- Worker/Pages 没收到请求；
- 换代理/其它 DNS 路径可能可访问。

处理：

- 不把 `workers.dev` / `pages.dev` 当唯一长期正式入口；
- 使用专用自定义域名；
- 对入口做本地 CF 优选；
- 不在未验证前把问题归因于 UUID/WS Path。

## 4. 解析正确但连接被远端重置

例如：

```text
read tcp ... -> Cloudflare-IP:443: connection forcibly closed
```

说明已经到了正确 Cloudflare 入口附近，问题可能在：

- 当前 Cloudflare Anycast 路线质量；
- TLS / SNI；
- WebSocket Upgrade；
- 客户端参数；
- 网络侧对长连接/域名的干扰。

排查：

1. 用 edgetunnel 面板“复制节点/自适应订阅”确认原生参数；
2. 检查 Host、SNI、Path、TLS、fingerprint；
3. 用 CFData 更换入口 IP；
4. 比较直连和代理环境；
5. 不要先改 ProxyIP，因为连接尚未进入出站层。

## 5. 根页面显示 Welcome to nginx

在 edgetunnel v2 中通常是正常伪装页，不等于部署错了。

继续测试：

- login 路由；
- admin 路由；
- 客户端生成节点。

如果伪装页正常但 admin 不正常，再查 ADMIN/KV/部署环境。

## 6. ADMIN 密码错误

不要从旧聊天“猜”当前密码。

检查：

- Cloudflare Pages 当前是 Production 环境还是 Preview；
- `ADMIN` 是否保存为当前 Production Secret；
- 变量变更后是否重新部署；
- 浏览器是否仍使用旧会话。

必要时直接在 Cloudflare 重置 ADMIN Secret，并轮换旧值。不要把新密码写 GitHub。

## 7. Pages 构建失败 / 建错项目类型

v2 必须是 Cloudflare **Pages Git build**，典型正式设置读 `edgetunnel-v2/DEPLOY.md`。

如果界面要求：

```text
npx wrangler deploy
npx wrangler versions upload
```

通常进入的是 Workers Builds，不是 v2 设计的 Pages 构建入口。

v2 正常关注：

- Production branch；
- Root directory；
- Build command；
- Build output directory。

构建日志还应确认 `sync-upstream.mjs` 的固定上游完整性校验成功。

## 8. GitHub 已连接但没有自动建置

v1 Workers Git 集成历史上出现过：GitHub App 权限正常，但 Cloudflare 没产生 Build/Check。

这类问题不要误判为 Worker 代码错误。检查：

- Build trigger / Git connection；
- root directory；
- build watch paths；
- Cloudflare 最近建置是否真正存在；
- GitHub commit 是否出现 Cloudflare check/status。

v2 已改用 Pages Git build，优先按 v2 的实际构建链路诊断。

## 9. 节点能用但速度很慢

如果日志没有连接错误、Google/YouTube/ChatGPT 能访问，但吞吐低：

优先怀疑：**客户端 → Cloudflare 入口线路**。

处理：

1. CFData-WEB 本地官方优选；
2. 0% 丢包优先；
3. 比较平均延迟和真实下载速度；
4. 真实测速线程用 1 避免候选互抢带宽；
5. 把 server 换成候选 CF IP，Host/SNI 保持自定义域名；
6. 用同一 YouTube 4K60 视频看 Connection Speed、Buffer Health、Dropped Frames。

如果入口已高速但只有 ChatGPT/Cloudflare 托管目标异常，再转查 ProxyIP/出站。

## 10. Google 可用但 ChatGPT / Cloudflare 站点异常

可能是 Cloudflare Worker/Pages 出站或 ProxyIP 层问题。

检查：

- edgetunnel 当前 ProxyIP 模式；
- 面板网络信息中的 ProxyIP/目标出口；
- 是否依赖上游默认 fallback；
- 自有/可信 ProxyIP 或链式 SOCKS5/HTTP(S) 是否更合适。

不要把入口 CF 优选 IP 当成 ProxyIP。

## 11. 关闭 Clash 后打不开 edgetunnel 后台

如果需要关闭代理做 CFData 本地测速，而后台域名直连又不可达：

- 用 SwitchHosts / Windows hosts 临时将后台域名映射到一个已验证可达的 CF 优选 IP；
- 或在 R2S/dnsmasq 做本地 DNS 覆写；
- HTTPS URL、Host/SNI 仍使用原域名；
- 不关闭证书验证。

实际 IP/域名映射不写 Public GitHub。

## 12. Clash 日志还显示旧节点 / 旧域名

如果新测试已经切换 v2，但日志仍出现旧组名、旧 `workers.dev` 等：

- 确认当前启用 Profile；
- 确认代理组选中了新节点；
- 重启 Mihomo Core；
- 清空/按当前时间查看日志；
- 不要拿数小时前旧 warning 当新结果。

## 13. Shadowrocket / Clash Verge / OpenClash 通用

遇到异常先检查：

- 是否使用了正确场景/配置；
- DNS 是否被本地设置覆盖；
- Provider 是否加载；
- 策略组选项是否实际选中预期节点；
- 规则顺序是否让更宽泛规则提前命中；
- IPv6 是否意外绕过；
- TUN/系统代理是否同时存在导致路径与预期不同；
- 日志是否是当前时间的实际请求。

平台专项问题继续读对应子目录 `docs/TROUBLESHOOTING.md`。
