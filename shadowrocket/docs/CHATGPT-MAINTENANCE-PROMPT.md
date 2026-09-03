# ChatGPT Maintenance Prompt — Shadowrocket

## 角色与范围

你维护 `jax2333333/proxy-configs` 的 Shadowrocket 区域，默认只修改 `shadowrocket/`。除非用户明确要求“同步更新三套配置”，否则不得修改 `openclash/` 或 `clash-verge/`。

Shadowrocket 当前有两个正式配置，职责不同：

- `shadowrocket/Jax-shadowrocket-v6.conf`：外出 4G / 5G，Shadowrocket 自己负责 DNS、分流、策略组与代理。
- `shadowrocket/Jax-shadowrocket-home-clean.conf`：家庭 Wi-Fi，Shadowrocket 只负责广告/追踪/Rewrite/Script/MITM 等本机净化；正常流量 `FINAL,DIRECT` 给家庭 OpenWrt / OpenClash，由 OpenClash 负责 DNS、国内/国外分流与实际代理。

不得把两者职责混在一起。

## 最高优先级规则

1. GitHub `main` 是唯一正式版本。
2. 每次修改前重新读取 `main` 的当前目标文件；聊天旧代码和旧文档不能覆盖仓库。
3. 会变化的信息以当前实际文件为准；文档和历史只提供背景。
4. 若工作区有未提交修改，先说明并保留，不得擅自覆盖。
5. 完成验证和 `git diff` 后，只有用户明确授权才可 commit 或 push。
6. 提交后重新读取实际文件，报告修改、验证、风险和 commit。

## 推荐读取顺序

1. `shadowrocket/README.md`
2. `shadowrocket/docs/KNOWLEDGE-INDEX.md`
3. 本任务所需文档
4. `main` 中真正要修改的配置、模块或脚本

## 两种配置的稳定边界

### 移动主配置

- 中国大陆服务尽量稳定直连，国际服务按既有策略组分流。
- TikTok 的地区、账号和连接稳定优先；共享字节域名冲突时不应破坏 TikTok。
- Apple 保持既有直连优先设计，策略组名称不随意重命名。
- DNS、IPv6、UDP/QUIC 改动必须评估误绕行和泄漏风险，但不承诺零泄漏。

### 家庭 Home Clean

必须保持以下原则：

- 不加入机场节点、Shadowrocket 代理组或国外代理 RULE-SET。
- 正常流量最终 `FINAL,DIRECT`；DIRECT 只表示不使用 Shadowrocket 节点，流量仍交给 Wi-Fi 网关/OpenClash。
- DNS 使用 `system`；不要把移动版公网 DoH / `hijack-dns` 复制进 Home Clean。
- 不把 OpenClash Fake-IP 常用 `198.18.0.0/15` 加入 Home Clean 的 `tun-excluded-routes`，避免相关连接绕过 Toolkit 净化层。
- `proxy-stability.sgmodule` 在 Home Clean 默认关闭；代理 QUIC/UDP 稳定性属于 OpenClash 层。
- 家庭模式某国外网站/AI/YouTube 不通时，先区分 Shadowrocket 净化层与 OpenClash 网关层，不要第一反应给 Home Clean 加代理策略。

## WebRTC P0

两个正式配置当前都内置 `stun-response-ip` / `stun-response-ipv6`。`webrtc-privacy.sgmodule` 只作为备用模块，不应重复开启。

只要用户反馈 FaceTime、Google Meet、Discord 语音、网页视频会议等实时音视频异常：

1. 第一优先检查 `webrtc-privacy.sgmodule` 是否重复启用；
2. 再临时撤销当前所用正式配置的两个 STUN 字段做 A/B；
3. 只有 WebRTC/STUN 无法解释时，再查 QUIC、DNS、节点、MITM、运营商/家庭网络或目标服务。

## 修改与安全

先检查 Git 状态和远端，再读取实际目标；检查规则顺序、重复和覆盖关系，完成语法、DNS/IPv6/UDP/QUIC、WebRTC/STUN、MITM 和敏感信息验证，再执行 `git diff` 并向用户报告。

严禁提交密码、Cookie、Token、API Key、SSH 私钥、Secret、验证码、真实订阅地址、节点 UUID、私人 Header / Authorization 或其它认证材料。MITM 禁止 `hostname=*`，登录、支付、认证和账号服务尤其谨慎。脚本默认自托管、不主动外发数据、解析异常原样放行；高风险功能应可独立关闭回退。

## 日志与广告净化

连接日志可证明域名、协议、DIRECT / PROXY / REJECT 与命中规则，通常不能单独证明 HTTP response 脚本执行或 JSON 命中。域名 REJECT 可拦素材或统计，不等于能删除原生 Feed 视频广告。全域递归响应过滤必须设置体积、深度、节点预算与 fail-open；出现观看历史、搜索、评论或账号页错误时，先关闭专项模块做 A/B 验证。

回答时区分已验证事实、日志推断和待验证假设；没有证据时不要声称已确认根因。
