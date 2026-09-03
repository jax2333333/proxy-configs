# JAX Shadowrocket

> [!IMPORTANT]
> ## 新对话 / ChatGPT 快速接管
> 仓库 jax2333333/proxy-configs，分支 main。读取 shadowrocket/README.md 顶部“新对话 / ChatGPT 快速接管”说明并按其指引接管项目。

本目录维护 iPhone / iOS 的 Shadowrocket 主配置、自托管规则和可独立启停的 Toolkit 模块。

## 唯一正式版本

- 正式仓库：`jax2333333/proxy-configs`
- 唯一正式分支：`main`
- 本目录：`shadowrocket/`

聊天记录、截图、日志、旧 commit 和本文档中的示例均不能替代 `main`。每次修改前重新读取实际目标文件；只作必要增量，提交后重新读取实际结果。

## 长期架构

```text
shadowrocket/
├── Jax-shadowrocket-v6.conf   # 正式主配置
├── README.md                  # 本入口与长期架构
├── rules/                     # JAX 自托管规则集（如 ai-core.list）
├── docs/                      # 当前约定、历史、教程与工作规则
└── toolkit/
    ├── README.md              # 当前模块清单与使用说明
    ├── modules/
    └── scripts/
```

- 主配置负责网络基础、策略组和长期稳定分流。
- `rules/` 只保存经过筛选、需要由 JAX 自己控制边界的规则集；不复制大而全社区列表。
- Toolkit 负责广告净化、URL 清理、HTTPDNS 防绕过、可选网络稳定性/隐私增强与专项脚本。
- 不为单一 App 的实验功能把临时逻辑塞入主配置。
- MITM 必须最小化，禁止 `hostname=*`；专项模块应可单独关闭回退。

## 当前稳定设计

- 主配置当前为 V6.3 系列；实际版本号必须读取 `Jax-shadowrocket-v6.conf`。
- `[Rule]` 顶部保留 `JAX Overrides`，仅放已验证且不与 TikTok 共享基础设施冲突的国内稳定补丁。
- AI 使用 `rules/ai-core.list`，避免把 Stripe、Auth0、Sentry 等共享 SaaS 域名宽泛送入 AI 策略。
- GitHub 使用独立 `💻 GitHub` 策略组。
- 已验证映射的核心社区规则优先引用用户同步维护的 `jax2333333/ios_rule_script` fork；没有确认等价映射的规则源不盲目替换。
- TikTok 规则始终位于抖音 DIRECT 规则之前；不把共享 ByteDance 域名直接判为国内。

## 稳定维护原则

- 中国大陆服务优先稳定直连，国际服务按既有策略组分流。
- DNS、IPv6、UDP/QUIC 改动以降低误绕行与泄漏风险为目标，不承诺绝对匿名或零泄漏。
- TikTok 的地区、账号与连接稳定性优先；共享字节域名冲突时不得破坏 TikTok。
- Apple 保持既有独立策略与直连优先设计；AI、YouTube、Spotify、Telegram、TikTok、GitHub 等策略组名称不随意改名。
- JS 默认 fail-open，不主动外发 Cookie、Header、Token、账号或播放凭据。
- GitHub 不保存 Cookie、Token、UUID、密码、API Key、SSH 私钥、Secret、验证码、真实订阅地址或私人认证材料。
- 未经明确要求，不修改 `openclash/` 或 `clash-verge/`。

## 专项提示

抖音原生广告与短剧集间广告属于持续实验。不能从聊天推断某个 v2/v3 仍为正式版，必须读取 `main` 中当前 module/script。素材 CDN 的 REJECT 不等于服务器插入视频广告必然消失；扩大 response Script / MITM 范围会增加回归风险。

HTTPDNS、QUIC 与 WebRTC 增强均应保持模块化：`httpdns-block-safe.sgmodule` 可单独 A/B；`proxy-stability.sgmodule` 与 `webrtc-privacy.sgmodule` 默认按需启用，不直接写死到主配置。

## 文档入口

- `docs/CHATGPT-MAINTENANCE-PROMPT.md`：ChatGPT 工作规则
- `docs/KNOWLEDGE-INDEX.md`：按任务定位资料
- `docs/CURRENT-CONFIG.md`：当前配置读取原则
- `docs/HISTORY.md`：历史与实验边界
- `docs/TROUBLESHOOTING.md`：日志和故障排查
- `docs/OPERATIONS.md`：恢复、更新与回滚教程
