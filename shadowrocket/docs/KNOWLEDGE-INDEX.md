# Knowledge Index

| 任务 | 必读 |
|---|---|
| 新对话接管 | `README.md` → `CHATGPT-MAINTENANCE-PROMPT.md` → 本索引 |
| 修改外出 4G / 5G 主配置 | `CURRENT-CONFIG.md` + `main` 中的 `Jax-shadowrocket-v6.conf` |
| 修改家庭 Wi-Fi 只净化配置 | `CURRENT-CONFIG.md` + `OPERATIONS.md` + `main` 中的 `Jax-shadowrocket-home-clean.conf`；必须保持正常流量 `FINAL,DIRECT`、DNS `system`、不复制 OpenClash 代理分流 |
| 设置 Wi-Fi / 蜂窝自动切换 | `OPERATIONS.md` → Shadowrocket 场景 + 两个正式配置 |
| 修改 JAX 自托管规则 | `CURRENT-CONFIG.md` + 当前 `rules/*.list` + 移动主配置对应 RULE-SET |
| 修改 Toolkit 模块 | `CURRENT-CONFIG.md` + `toolkit/README.md` + 当前目标 module/script |
| HTTPDNS 防绕过 | `CURRENT-CONFIG.md` + `TROUBLESHOOTING.md` + 当前 `httpdns-block-safe.sgmodule` |
| FaceTime / Google Meet / Discord 语音 / 网页视频会议异常 | **P0：先读 `TROUBLESHOOTING.md` → WebRTC / STUN** + `CURRENT-CONFIG.md` + 当前所用配置 `[General]` + `webrtc-privacy.sgmodule`；先排查 WebRTC Privacy，再查 QUIC / DNS / 节点 |
| 抖音 / TikTok 广告问题 | `HISTORY.md` + `TROUBLESHOOTING.md` + 当前专项 module/script |
| YouTube 去广告 | `CURRENT-CONFIG.md` + 当前 YouTube module/script |
| DNS / IPv6 / QUIC / WebRTC | `TROUBLESHOOTING.md` + 当前所用配置 `[General]` + 对应 Toolkit 模块 |
| 分析 Shadowrocket `.db` | `TROUBLESHOOTING.md` |
| 模块安装、更新、回滚 | `OPERATIONS.md` |

## 权威性顺序

1. GitHub `main` 当前实际配置、规则、模块和脚本
2. 本目录当前文档
3. 当前设备完整日志和复现证据
4. 历史记录
5. 聊天中的旧代码、截图或旧 commit

冲突时以更高优先级来源为准。
