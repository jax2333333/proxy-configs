# JAX Proxy Configs

集中维护 JAX 的三套代理配置。

## 目录

- `shadowrocket/` — iPhone / Shadowrocket，外出 4G / 5G 使用
- `clash-verge/` — macOS / Windows Clash Verge Rev + Mihomo
- `openclash/` — R2S / OpenWrt OpenClash + Mihomo Smart

## 安全约定

- 仓库中的 Clash/OpenClash 配置 **不保存真实机场订阅 URL、Token、密码或其他凭据**。
- `proxy-providers.Airport1.url` 使用占位地址；真实订阅地址仅在本地设备中填写。
- 修改配置前优先检查 YAML/规则引用以及是否意外加入敏感信息。
- Shadowrocket 的更新地址统一指向本仓库 `main` 分支的 raw 文件。

## 原始来源

- Shadowrocket Gist: `3745fc1bc0d793346c2caae32fdc3d35`
- Clash Verge Gist: `50ddce2fe0f2e587a80b94f6c9ed49eb`
- OpenClash Gist: `e578e785ab374a2ae4d4bfd4d3c91593`

后续以本仓库中的版本作为主要维护版本。