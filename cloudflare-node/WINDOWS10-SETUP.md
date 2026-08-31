# Windows 10 从零部署 JAX Cloudflare Node

本文用于在 Windows 10 上，从零把本仓库 `cloudflare-node/` 部署到 Cloudflare Workers。

## 0. 前提

- 已有 GitHub 账号并能访问 `jax2333333/proxy-configs`
- 已有 Cloudflare 账号
- 当前仓库目录：`cloudflare-node/`
- 不把真实 UUID、WS_PATH、API Token 写进 GitHub

## 1. 安装 Node.js

打开：

```text
https://nodejs.org/
```

下载安装当前 LTS 版本。

安装完成后打开 PowerShell：

```powershell
node -v
npm -v
```

能显示版本号即可。

## 2. 克隆仓库

PowerShell：

```powershell
cd $HOME\Desktop
git clone https://github.com/jax2333333/proxy-configs.git
cd proxy-configs\cloudflare-node
```

如果没有 Git，可安装 Git for Windows：

```text
https://git-scm.com/download/win
```

## 3. 登录 Cloudflare Wrangler

在 `cloudflare-node` 目录运行：

```powershell
npx wrangler login
```

浏览器会打开 Cloudflare 授权页面，登录并授权即可。

## 4. 生成 UUID

Windows PowerShell 可直接运行：

```powershell
[guid]::NewGuid().ToString()
```

复制生成结果并保存到本地密码管理器或安全笔记。

## 5. 生成随机 WS_PATH

PowerShell：

```powershell
$bytes = New-Object byte[] 12
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
'/jax-' + (($bytes | ForEach-Object { $_.ToString('x2') }) -join '')
```

示例：

```text
/jax-0123456789abcdef01234567
```

不要把真实值写进 GitHub。

## 6. 写入 Cloudflare Secrets

在 `cloudflare-node` 目录运行：

```powershell
npx wrangler secret put UUID
```

提示输入值时粘贴你的 UUID。

然后：

```powershell
npx wrangler secret put WS_PATH
```

提示输入值时粘贴你的随机路径。

## 7. 部署 Worker

运行：

```powershell
npx wrangler deploy
```

成功后 Wrangler 会输出类似：

```text
https://jax-cf-node.<你的子域>.workers.dev
```

记录完整域名。

## 8. 测试 Worker 是否在线

浏览器直接打开 Worker 根地址，例如：

```text
https://jax-cf-node.<你的子域>.workers.dev/
```

正常情况下会返回：

```text
Not Found
```

这是预期行为，因为 Worker 只接受指定 WS_PATH 的 WebSocket 请求。

## 9. Shadowrocket 参数

```text
类型：VLESS
服务器：jax-cf-node.<你的子域>.workers.dev
端口：443
UUID：你的 UUID
传输：WebSocket
TLS：开启
SNI：jax-cf-node.<你的子域>.workers.dev
Host：jax-cf-node.<你的子域>.workers.dev
Path：你的 WS_PATH
UDP：关闭
```

节点名建议：

```text
☁️ CF-Auto
```

## 10. Clash Verge / OpenClash / Mihomo 模板

```yaml
proxies:
  - name: "☁️ CF-Auto"
    type: vless
    server: jax-cf-node.<你的子域>.workers.dev
    port: 443
    uuid: YOUR_UUID
    network: ws
    tls: true
    servername: jax-cf-node.<你的子域>.workers.dev
    udp: false
    ws-opts:
      path: /YOUR_WS_PATH
      headers:
        Host: jax-cf-node.<你的子域>.workers.dev
```

真实值只保存在本地配置。

## 11. 第一轮测试

建议依次测试：

1. Google
2. GitHub
3. ChatGPT
4. YouTube
5. Telegram

注意：Cloudflare Workers TCP Socket 不能连接 Cloudflare 自身 IP 范围，所以部分使用 Cloudflare CDN 的目标可能失败。这不是客户端配置错误，而是 Workers 平台限制。后续如确有需要，再评估自有或可信 ProxyIP，不默认使用公共 ProxyIP。

## 12. 后续维护

以后修改 Worker：

```powershell
cd $HOME\Desktop\proxy-configs
git pull
```

修改完成后提交 GitHub，再部署：

```powershell
cd cloudflare-node
npx wrangler deploy
```

如果后续启用 Cloudflare GitHub Builds，则 `main` 分支的 `cloudflare-node/` 更新可以自动部署，不再需要本机手动执行 `wrangler deploy`。
