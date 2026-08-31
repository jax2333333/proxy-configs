# Cloudflare Pages 网页部署步骤

目标：不用 Windows PowerShell，只使用 GitHub + Cloudflare Dashboard。

## 1. 新建 Pages 项目

Cloudflare Dashboard：

```text
Workers 和 Pages
→ 创建应用程序
→ Pages
→ 连接到 Git
```

选择：

```text
jax2333333/proxy-configs
```

项目名称建议：

```text
jax-cf-edgetunnel
```

生产分支：

```text
main
```

根目录：

```text
cloudflare-node/edgetunnel-v2
```

构建命令：

```text
node sync-upstream.mjs
```

构建输出目录：

```text
dist
```

不要填写任何 GitHub 中可见的敏感环境变量。

## 2. 添加生产环境变量 / Secrets

部署项目后进入 Pages 项目设置，在生产环境添加：

```text
ADMIN
UUID
KEY
OFF_LOG
```

值要求：

- `ADMIN`：至少 24+ 随机字符，禁止弱密码。
- `UUID`：标准 UUIDv4。
- `KEY`：至少 24+ 随机字符，只用于自己的快速订阅路径。
- `OFF_LOG`：`1`。

建议不要设置 `DEBUG`。

`PROXYIP` 暂时不填也可以用于验证面板和节点生成，但必须知道：固定上游版本在没有自定义 `PROXYIP` 时会使用作者的默认 ProxyIP fallback；这不是零第三方方案。正式长期使用前应决定是否接受，或换成自有/可信出站。

变量保存后重新部署一次生产版本。

## 3. 创建 KV

在 Cloudflare 创建一个 KV namespace，例如：

```text
jax-cf-edgetunnel-kv
```

然后回到 Pages 项目：

```text
设置
→ 绑定
→ 添加
→ KV 命名空间
```

变量名称必须填写：

```text
KV
```

选择刚创建的 namespace，保存后重新部署。

## 4. 访问后台

Pages 自动生成的临时地址类似：

```text
https://jax-cf-edgetunnel.pages.dev/admin
```

输入 `ADMIN` 登录。

只把 `pages.dev` 当首次验证入口。

## 5. 绑定自定义域名

验证后台正常后，进入：

```text
自定义域
→ 设置自定义域
```

建议使用专用子域，例如：

```text
cf2.example.com
```

不要使用根域名。

以后节点：

```text
Host / SNI = cf2.example.com
```

第一轮测试可以让 `server` 也使用这个域名；后续做 Cloudflare 优选时，可以把 `server` 换成测速后的 CF IP/优选域名，而 Host/SNI 保持自定义域名。

## 6. 初始后台配置原则

第一轮只启用最少配置：

- 先使用 VLESS。
- TLS 开启。
- 优先 WS 做兼容性测试。
- 不一次导入大量公共优选 API。
- 不启用 DEBUG。
- KV 日志关闭（`OFF_LOG=1`）。
- 不把订阅地址、后台 URL、ADMIN、UUID、KEY 发到公开渠道。

测试顺序：

```text
Clash Verge
→ Shadowrocket
→ Google / YouTube
→ ChatGPT / Cloudflare 托管网站
→ 再做 CF 优选 IP
```

## 7. 更新上游

不要在 Cloudflare 里直接改 `_worker.js`。

未来更新统一修改本仓库：

```text
cloudflare-node/edgetunnel-v2/sync-upstream.mjs
cloudflare-node/edgetunnel-v2/UPSTREAM.md
```

更新 commit 和对应 Git blob SHA 后，Cloudflare Pages 自动构建新的固定版本。
