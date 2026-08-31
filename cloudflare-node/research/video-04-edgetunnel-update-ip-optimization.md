# Video 04 — Edgetunnel 高级教程：代码更新 / IP 优选

来源：用户上传视频《【Cloudflare 第4期】高速节点 Edgetunnel 高级教程 代码更新 IP优选》

时长：约 11 分 17 秒。

## 视频核心内容

这期重点不是从零部署，而是讲已经部署好的 edgetunnel 后续如何更新代码、如何验证更新、以及如何利用 Cloudflare 优选节点继续提升速度。

### 1. Edgetunnel 自带版本检查 / 下载入口

视频先进入 edgetunnel 管理后台的“关于 edgetunnel”窗口，对比当前版本和最新版本。

后台可以直接取得两类更新资源：

- Pages 部署包（Pages.zip）
- Workers 最新 JS 源码

这意味着后续维护不必每次重新从头部署。

### 2. Pages 更新流程

视频演示的 Pages 更新思路：

1. 下载最新 Pages 更新包。
2. 解压得到 Pages 部署内容。
3. 进入 Cloudflare Pages 项目。
4. 新建 / 上传一次新的部署。
5. 等部署成功。
6. 打开伪装主页确认仍能看到 nginx 页面。
7. 登录 edgetunnel 后台确认配置仍然存在。
8. 用客户端测试节点。

重点：Pages 的旧部署仍然保留，因此如果新版本有问题，可以从部署历史回退。

### 3. Workers 更新流程

Workers 的更新思路：

1. 从 edgetunnel 后台获取最新 Workers.js 源码。
2. 打开 Cloudflare Worker 在线编辑器。
3. 用新源码覆盖旧 Worker 代码。
4. 部署新版本。
5. 打开伪装页 / 后台验证。
6. 客户端重新测试节点。

Cloudflare Worker 会保存历史版本，因此更新失败时可回滚。

### 4. 更新后验证顺序

视频实际采用的验证方式值得保留：

1. 根路径能打开伪装 nginx 页面。
2. /login 或 /admin 能进入后台。
3. 后台配置仍存在。
4. 客户端节点能连通。
5. Google / YouTube 等实际访问正常。

不要只看“部署成功”状态。

### 5. 对 JAX CF edgetunnel v2 的启发

当前 JAX 方案比视频更保守：

- GitHub `proxy-configs/main` 是唯一正式维护入口。
- `cloudflare-node/edgetunnel-v2/` 固定上游 commit。
- `sync-upstream.mjs` 下载固定版本的 `_worker.js` 并校验 Git blob SHA。
- 不直接自动追踪上游 main。

因此正式维护不应该照视频每次手工覆盖未知最新版，而应该：

1. 发现 upstream 新版本。
2. 检查代码差异 / 安全变化。
3. 更新固定 commit + blob SHA。
4. GitHub 提交。
5. Pages 自动部署。
6. 完成伪装页、后台、客户端、YouTube 实测。
7. 有异常就回滚前一 commit / Pages deployment。

### 6. IP 优选部分

视频展示高速 Cloudflare 节点 / 优选思路，但对 JAX 当前环境最实用的做法仍是：

- 使用 CFData-WEB 在本地网络进行 Cloudflare IPv4 443 测速。
- 关注 0% 丢包、实际下载速度和稳定性，不只看延迟。
- 将少量实测优选 IP 加入 edgetunnel 自定义优选。
- 客户端连接优选 IP，但 Host / SNI 保持 `edt.sbwall.ccwu.cc`。
- 最后通过 YouTube Stats for Nerds 的 Connection Speed / Buffer Health 做真实业务验证。

用户当前实测已经从约 3 Mbps 提升到约 91 Mbps，说明该方法有效。

## 与“不开 Clash 访问后台”的关系

这期视频本身并没有提供一个比本地 Hosts / DNS 覆写更直接的解决方案。

如果 `edt.sbwall.ccwu.cc` 在直连网络下无法稳定访问，而打开 Clash 又会污染本地优选测试，最实用的仍是：

- Windows 本地 Hosts 将 `edt.sbwall.ccwu.cc` 指向一个已验证的 Cloudflare 优选 IP；或
- 在路由器 / dnsmasq 中做本地 DNS override；或
- 使用 SwitchHosts 做一键 Hosts 切换。

这样浏览器仍访问 `https://edt.sbwall.ccwu.cc/admin`，TLS Host / SNI 保持域名，但底层直接走指定的 Cloudflare 优选 IP，不需要开启 Clash。

## 安全注意

- 更新前必须保留可回滚版本。
- 不要把 ADMIN、UUID、KEY、订阅 token 写进公开 GitHub。
- 不建议无审查追踪第三方 upstream main。
- 更新后一定做真实节点和视频流测试，而不是只看 Cloudflare 部署状态。
