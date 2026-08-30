# JAX Cloudflare Node

一个尽量精简、完全自用的 Cloudflare Workers VLESS 节点实现。

## 设计目标

- Cloudflare Workers Free 可部署
- VLESS + WebSocket + TLS
- 只支持 TCP，不支持 UDP / MUX / BT / PT
- 不依赖公共 ProxyIP
- 不依赖第三方订阅转换服务
- 不在 GitHub 中保存真实 UUID、WS Path、Token、API Key
- 可用于 Shadowrocket、Clash Verge Rev、OpenClash / Mihomo

## 文件

- `worker.js`：Worker 主程序
- `wrangler.toml.example`：Wrangler 配置模板
- `.gitignore`：避免本地 secrets / Wrangler 文件误提交

## 1. 准备 UUID 和 WS Path

在本地生成 UUID：

```bash
uuidgen | tr '[:upper:]' '[:lower:]'
```

生成随机 WebSocket Path：

```bash
printf '/jax-%s\n' "$(openssl rand -hex 12)"
```

示例仅用于说明：

```text
UUID    = 00000000-0000-4000-8000-000000000000
WS_PATH = /jax-0123456789abcdef01234567
```

不要把真实值提交到本仓库。

## 2. Cloudflare Dashboard 部署

1. 登录 Cloudflare Dashboard。
2. 进入 `Workers & Pages`，创建一个 Worker，例如 `jax-cf-node`。
3. 将本目录 `worker.js` 的内容作为 Worker 代码并部署。
4. 进入该 Worker 的 `Settings` → `Variables and Secrets`。
5. 新建两个加密 Secret：
   - `UUID`：你刚生成的 UUID。
   - `WS_PATH`：你刚生成的随机路径，必须以 `/` 开头。
6. 保存后重新部署。

建议不要把 UUID 或随机路径作为普通明文变量公开在代码仓库中。

## 3. 可选：Wrangler 部署

复制示例配置：

```bash
cp wrangler.toml.example wrangler.toml
```

然后设置 Secrets：

```bash
npx wrangler secret put UUID
npx wrangler secret put WS_PATH
npx wrangler deploy
```

`wrangler.toml`、`.dev.vars`、`.env*` 已通过 `.gitignore` 排除。

## 4. 域名

优先推荐给 Worker 绑定自己的 Cloudflare Custom Domain，例如：

```text
cf.example.com
```

也可以先使用 Cloudflare 自动分配的：

```text
jax-cf-node.<你的 workers.dev 子域>.workers.dev
```

客户端中的 `server`、`Host`、`SNI/servername` 必须使用你实际部署的域名。

## 5. Shadowrocket

手动添加 VLESS 节点：

```text
类型：VLESS
地址：cf.example.com
端口：443
UUID：<YOUR_UUID>
传输：WebSocket
TLS：开启
SNI：cf.example.com
Host：cf.example.com
Path：<YOUR_WS_PATH>
UDP：关闭
```

节点名称建议：

```text
☁️ CF-Auto
```

## 6. Clash Verge Rev / OpenClash / Mihomo

模板：

```yaml
proxies:
  - name: "☁️ CF-Auto"
    type: vless
    server: cf.example.com
    port: 443
    uuid: YOUR_UUID
    network: ws
    tls: true
    servername: cf.example.com
    udp: false
    ws-opts:
      path: /YOUR_WS_PATH
      headers:
        Host: cf.example.com
```

注意：本模板中的真实 UUID、域名和 WS Path 应只保存在本地配置中，不要直接提交到这个 Public 仓库。

## 7. 当前限制

本项目刻意保持精简：

- 只处理 VLESS TCP 请求。
- 不实现 UDP 转发，因此不适合作为游戏节点。
- 不提供固定国家 / 地区出口，不能把 Cloudflare Worker 当成固定日本、美国或新加坡 VPS。
- 不适合 BT / PT、大流量下载、长期 4K 视频主力线路。
- Cloudflare Workers 的出站 TCP 无法连接 Cloudflare 自身 IP 范围，因此部分目标可能无法通过此最简实现访问。
- 第一阶段不使用 ProxyIP；如果实际测试确实存在必要，再单独评估自建或可信 ProxyIP，而不是直接接入公共 ProxyIP。

## 8. 建议测试顺序

部署完成后依次测试：

1. Google
2. GitHub
3. ChatGPT
4. YouTube
5. Telegram
6. 移动网络 / 家宽分别测速和稳定性测试

如果基础版本稳定，再考虑增加第二个 `☁️ CF-Best` 优选入口节点。优选 IP 只优化“客户端 → Cloudflare”这一段，不代表获得固定国家出口。

## 安全约定

- 本目录所在仓库为 Public。
- 禁止提交真实 UUID、Cloudflare API Token、Account ID、私有 Cookie、密码、真实机场订阅地址等敏感信息。
- 修改 `worker.js` 前以 GitHub `main` 分支最新版为准。
- 不默认引入第三方 ProxyIP、订阅转换器或外部节点池。
