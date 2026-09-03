# JAX Shadowrocket

> [!IMPORTANT]
> ## 新对话 / ChatGPT 快速接管
> 仓库 jax2333333/proxy-configs，分支 main。读取 shadowrocket/README.md 顶部“新对话 / ChatGPT 快速接管”说明并按其指引接管项目。

本目录维护 iPhone / iOS 的 Shadowrocket 移动主配置、家庭 Wi-Fi 净化配置、自托管规则和可独立启停的 Toolkit 模块。

## 唯一正式版本

- 正式仓库：`jax2333333/proxy-configs`
- 唯一正式分支：`main`
- 本目录：`shadowrocket/`

聊天记录、截图、日志、旧 commit 和本文档中的示例均不能替代 `main`。每次修改前重新读取实际目标文件；只作必要增量，提交后重新读取实际结果。

## 长期架构

```text
shadowrocket/
├── Jax-shadowrocket-v6.conf          # 外出 4G / 5G：Shadowrocket 自己负责代理与分流
├── Jax-shadowrocket-home-clean.conf  # 家庭 Wi-Fi：Shadowrocket 只净化，OpenClash 负责代理与分流
├── README.md                         # 本入口与长期架构
├── rules/                            # JAX 自托管规则集（如 ai-core.list）
├── docs/                             # 当前约定、历史、教程与工作规则
└── toolkit/
    ├── README.md                     # 当前模块清单与使用说明
    ├── modules/
    └── scripts/
```

- `Jax-shadowrocket-v6.conf`：移动网络正式主配置，负责网络基础、策略组、DNS 与长期稳定分流。
- `Jax-shadowrocket-home-clean.conf`：家庭 Wi-Fi 专用净化配置，不包含代理节点/策略组，正常流量 `FINAL,DIRECT` 交给 OpenWrt / OpenClash；DNS 使用 `system`，不在 Shadowrocket 层指定公网 DoH 或 `hijack-dns`。
- `rules/` 只保存经过筛选、需要由 JAX 自己控制边界的规则集；不复制大而全社区列表。
- Toolkit 负责广告净化、URL 清理、HTTPDNS 防绕过、可选网络稳定性增强与专项脚本。
- 不为单一 App 的实验功能把临时逻辑塞入正式配置。
- MITM 必须最小化，禁止 `hostname=*`；专项模块应可单独关闭回退。

## 当前稳定设计

### 外出 4G / 5G

- 移动主配置当前为 V6.3 系列；实际版本号必须读取 `Jax-shadowrocket-v6.conf`。
- `[Rule]` 顶部保留 `JAX Overrides`，仅放已验证且不与 TikTok 共享基础设施冲突的国内稳定补丁。
- AI 使用 `rules/ai-core.list`，避免把 Stripe、Auth0、Sentry 等共享 SaaS 域名宽泛送入 AI 策略。
- GitHub 使用独立 `💻 GitHub` 策略组。
- 已验证映射的核心社区规则优先引用用户同步维护的 `jax2333333/ios_rule_script` fork；没有确认等价映射的规则源不盲目替换。
- TikTok 规则始终位于抖音 DIRECT 规则之前；不把共享 ByteDance 域名直接判为国内。

### 家庭 Wi-Fi

家庭配置的职责链固定为：

```text
iPhone
→ Shadowrocket（Toolkit 净化层）
  ├─ 命中模块：REJECT / URL Rewrite / Script / MITM
  └─ 正常流量：DIRECT
→ OpenWrt / OpenClash
  ├─ 国内：DIRECT
  └─ 国外：OpenClash 代理
```

家庭配置的 `DIRECT` 仅表示“不使用 Shadowrocket 节点”，流量仍会继续经过当前 Wi-Fi 网关，因此 OpenClash 仍能执行透明代理与分流。

家庭配置长期边界：

- 不添加机场节点、Shadowrocket 代理组或国外分流规则。
- `dns-server = system`，让家庭 OpenWrt / OpenClash DNS 链路继续负责解析；不配置公网 DoH 与 `hijack-dns`。
- `FINAL,DIRECT` 必须保持为最后兜底。
- 不把 OpenClash Fake-IP 常用的 `198.18.0.0/15` 加入 `tun-excluded-routes`，避免相关连接绕开 Shadowrocket Toolkit 净化层。
- `proxy-stability.sgmodule` **不要求因回家而关闭**。它只作用于 Shadowrocket 自己的 PROXY 连接；Home Clean 正常流量均为 DIRECT，所以保持开启时通常基本不生效。家庭实际代理 QUIC 仍由 OpenClash 层负责。
- 如果外出移动模式需要 `proxy-stability.sgmodule`，可以让模块长期保持开启，无需随 Wi-Fi / 蜂窝场景来回切换；只有移动端实测出现延迟、功耗或兼容性变差时才关闭。
- 可以通过 Shadowrocket“场景”按家庭 Wi-Fi SSID 自动使用家庭配置，蜂窝网络自动使用移动配置。

## 稳定维护原则

- 中国大陆服务优先稳定直连，国际服务按既有策略组或家庭 OpenClash 分流。
- DNS、IPv6、UDP/QUIC 改动以降低误绕行与泄漏风险为目标，不承诺绝对匿名或零泄漏。
- TikTok 的地区、账号与连接稳定性优先；共享字节域名冲突时不得破坏 TikTok。
- Apple 保持既有独立策略与直连优先设计；AI、YouTube、Spotify、Telegram、TikTok、GitHub 等移动配置策略组名称不随意改名。
- JS 默认 fail-open，不主动外发 Cookie、Header、Token、账号或播放凭据。
- GitHub 不保存 Cookie、Token、UUID、密码、API Key、SSH 私钥、Secret、验证码、真实订阅地址或私人认证材料。
- 未经明确要求，不修改 `openclash/` 或 `clash-verge/`。

## 专项提示

抖音原生广告与短剧集间广告属于持续实验。不能从聊天推断某个 v2/v3 仍为正式版，必须读取 `main` 中当前 module/script。素材 CDN 的 REJECT 不等于服务器插入视频广告必然消失；扩大 response Script / MITM 范围会增加回归风险。

HTTPDNS 仍由 `httpdns-block-safe.sgmodule` 独立 A/B。`proxy-stability.sgmodule` 是按需功能，但如果用户决定在移动模式启用，可以保持模块长期打开：Home Clean 因 `FINAL,DIRECT` 基本不会触发 `all-proxy`，不需要为了回家/出门手动切模块。WebRTC Privacy 当前已经写入正式移动配置和家庭配置；`webrtc-privacy.sgmodule` 只保留为备用/迁移模块，不要与正式配置重复开启。FaceTime、Google Meet、Discord 语音或网页视频会议异常时，第一优先排查 WebRTC Privacy / STUN 层。

## 文档入口

- `docs/CHATGPT-MAINTENANCE-PROMPT.md`：ChatGPT 工作规则
- `docs/KNOWLEDGE-INDEX.md`：按任务定位资料
- `docs/CURRENT-CONFIG.md`：当前配置读取原则
- `docs/HISTORY.md`：历史与实验边界
- `docs/TROUBLESHOOTING.md`：日志和故障排查
- `docs/OPERATIONS.md`：恢复、更新、场景切换与回滚教程
