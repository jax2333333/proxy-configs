# Knowledge Index

| 任务 | 必读 |
|---|---|
| 新对话接管 | `README.md` → `CHATGPT-MAINTENANCE-PROMPT.md` → 本索引 |
| 新增 iPhone / iPad，从零复制当前 Shadowrocket 架构 | **`IOS-NEW-DEVICE-SETUP.md`** → `CURRENT-CONFIG.md` → `CURRENT-MITM-CERTIFICATE.md` → `toolkit/README.md`；每台设备默认生成独立 CA，私人订阅与证书私钥只保存在设备本机 |
| 修改外出 / 蜂窝 / 非家庭 Wi-Fi 主配置 | `CURRENT-CONFIG.md` + `main` 中的 `Jax-shadowrocket-v6.conf` |
| 修改家庭 Wi-Fi 只净化配置 | `CURRENT-CONFIG.md` + `OPERATIONS.md` + `main` 中的 `Jax-shadowrocket-home-clean.conf`；必须保持正常流量 `FINAL,DIRECT`、DNS `system`、不复制 OpenClash 代理分流 |
| 设置 Wi-Fi / 蜂窝自动切换 | `OPERATIONS.md` → 三层场景：家庭指定 SSID → Home Clean；蜂窝 → Mobile；默认/其它 Wi-Fi → Mobile |
| 外部 / 公共 Wi-Fi 走错配置 | `OPERATIONS.md` → “外部 Wi-Fi 验证” + `CURRENT-CONFIG.md`；Home Clean 只允许明确受信且后端有 OpenClash 的家庭 SSID，未知 Wi-Fi 必须回落 Mobile |
| 修改 JAX 自托管规则 | `CURRENT-CONFIG.md` + 当前 `rules/*.list` + 移动主配置对应 RULE-SET |
| 修改 Toolkit 模块 | `CURRENT-CONFIG.md` + `toolkit/README.md` + 当前目标 module/script |
| MITM / HTTPS 解密 / Mobile 与 Home Clean 共享 CA | `CURRENT-MITM-CERTIFICATE.md` + `OPERATIONS-MITM-CERTIFICATE.md`；真实 `ca-p12`、私钥、证书密码只保存在 iPhone 本机，禁止写入 GitHub |
| 5G YouTube 去广告正常、家庭 Wi-Fi 又出现广告 | `HISTORY-MITM-CERTIFICATE-20260904.md` + `CURRENT-MITM-CERTIFICATE.md` + `TROUBLESHOOTING.md` + 当前 `youtube-adblock.sgmodule`；第一优先检查本地共享 CA / iOS 完全信任 / 模块开关 |
| HTTPDNS 防绕过 | `CURRENT-CONFIG.md` + `TROUBLESHOOTING.md` + 当前 `httpdns-block-safe.sgmodule` |
| FaceTime / Google Meet / Discord 语音 / 网页视频会议异常 | **P0：先读 `TROUBLESHOOTING.md` → WebRTC / STUN** + `CURRENT-CONFIG.md` + 当前所用配置 `[General]` + `webrtc-privacy.sgmodule`；先排查 WebRTC Privacy，再查 QUIC / DNS / 节点 |
| 抖音 / TikTok 广告问题 | `HISTORY.md` + `TROUBLESHOOTING.md` + 当前专项 module/script |
| YouTube 去广告 | `CURRENT-CONFIG.md` + `CURRENT-MITM-CERTIFICATE.md` + 当前 YouTube module/script；涉及多场景差异时同时读 `OPERATIONS-MITM-CERTIFICATE.md` |
| DNS / IPv6 / QUIC / WebRTC | `TROUBLESHOOTING.md` + 当前所用配置 `[General]` + 对应 Toolkit 模块 |
| 分析 Shadowrocket `.db` | `TROUBLESHOOTING.md` |
| 模块安装、更新、回滚 | `OPERATIONS.md` |

## 场景安全原则

```text
家庭指定 SSID → Home Clean
蜂窝数据      → Mobile
默认/其它网络 → Mobile
```

Home Clean 是窄范围例外，Mobile 是安全兜底。不要将“所有 Wi-Fi”泛化绑定 Home Clean。

## 权威性顺序

1. GitHub `main` 当前实际配置、规则、模块和脚本
2. 本目录当前文档
3. 当前设备完整日志和复现证据
4. 历史记录
5. 聊天中的旧代码、截图或旧 commit

冲突时以更高优先级来源为准。
