# JAX Shadowrocket

> [!IMPORTANT]
> ## 新对话 / ChatGPT 快速接管
> 仓库 jax2333333/proxy-configs，分支 main。读取 shadowrocket/README.md 顶部“新对话 / ChatGPT 快速接管”说明并按其指引接管项目。

本目录维护 iPhone / iOS 的 Shadowrocket 主配置和可独立启停的 Toolkit 模块。

## 唯一正式版本

- 正式仓库：`jax2333333/proxy-configs`
- 唯一正式分支：`main`
- 本目录：`shadowrocket/`

聊天记录、截图、日志、旧 commit 和本文档中的示例均不能替代 `main`。每次修改前，检查工作区、分支、远端关系与目标文件；只作必要增量，提交后重新读取实际结果。

## 长期架构

```text
shadowrocket/
├── Jax-shadowrocket-v6.conf   # 正式主配置
├── README.md                  # 本入口与长期架构
├── docs/                      # 当前约定、历史、教程与工作规则
└── toolkit/
    ├── README.md              # 当前模块清单与使用说明
    ├── modules/
    └── scripts/
```

- 主配置负责网络基础、策略组和长期稳定分流。
- Toolkit 负责广告净化、URL 清理、隐私增强与专项脚本。
- 不为单一 App 的实验功能把临时逻辑塞入主配置。
- MITM 必须最小化，禁止 `hostname=*`；专项模块应可单独关闭回退。

## 稳定维护原则

- 中国大陆服务优先稳定直连，国际服务按既有策略组分流。
- DNS、IPv6、UDP/QUIC 改动以降低误绕行与泄漏风险为目标，不承诺绝对匿名或零泄漏。
- TikTok 的地区、账号与连接稳定性优先；共享字节域名冲突时不得破坏 TikTok。
- Apple 保持既有独立策略与直连优先设计；AI、YouTube、Spotify、Telegram、TikTok 等策略组名称不随意改名。
- JS 默认 fail-open，不主动外发 Cookie、Header、Token、账号或播放凭据。
- GitHub 不保存 Cookie、Token、UUID、密码、API Key、SSH 私钥、Secret、验证码、真实订阅地址或私人认证材料。
- 未经明确要求，不修改 `openclash/` 或 `clash-verge/`。

## 专项提示

抖音原生广告与短剧集间广告属于持续实验。不能从聊天推断某个 v2/v3 仍为正式版，必须读取 `main` 中当前 module/script。素材 CDN 的 REJECT 不等于服务器插入视频广告必然消失；扩大 response Script / MITM 范围会增加回归风险。

## 文档入口

- `docs/CHATGPT-MAINTENANCE-PROMPT.md`：ChatGPT 工作规则
- `docs/KNOWLEDGE-INDEX.md`：按任务定位资料
- `docs/CURRENT-CONFIG.md`：当前配置读取原则
- `docs/HISTORY.md`：历史与实验边界
- `docs/TROUBLESHOOTING.md`：日志和故障排查
- `docs/OPERATIONS.md`：恢复、更新与回滚教程
