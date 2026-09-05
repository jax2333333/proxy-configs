# Shadowrocket 操作关键词

> 本文件定义“先给关键词、用户复制关键词后直接执行”的操作入口。它不是当前配置副本；每次实际操作仍必须重新读取 GitHub `main` 的真实文件与状态。

## 使用方式

当用户问“我现在可以做什么”“下一步建议”“给我操作关键词”“有哪些可操作项”时：

1. 先读取 `shadowrocket/README.md`、`docs/KNOWLEDGE-INDEX.md`、本文件；
2. 再读取 GitHub `main` 当前状态、最近相关提交、目标配置 / Toolkit / CI 状态；
3. 只推荐当前真正有意义的操作关键词，不机械输出整张清单；
4. 每个关键词用独立代码块输出，便于 iPhone / iPad 一键复制；
5. 用户随后直接发送关键词，即进入对应操作，不要求重新解释背景。

## 授权边界

- `检查`、`体检`、`排查`、`查看`、`推荐`：默认只读，不修改 GitHub。
- `同步`、`优化`、`更新`、`建立`、`添加`、`修复`：用户主动发送该关键词，视为对**该关键词明确范围**的一次性修改授权。
- 关键词授权不扩展到其它目录或其它配置；默认只处理 `shadowrocket/`。涉及 `openclash/`、`clash-verge/` 或其它仓库时必须有明确对应指令。
- 每次写入前仍要重新读取 `main` 最新目标文件；写入后重新读取并检查 CI / diff / 实际结果。

## 常用入口

### 新设备与部署

`新 iOS 完整安装`

一次性输出新 iPhone / iPad 从零部署 Shadowrocket 的完整流程：本地订阅 → Mobile / Home Clean → 独立 CA → 完全信任 → 本机 `JAX MITM Certificate` → 基础 Toolkit / YouTube → 三层场景 → 5G 验收 → Home Clean 验收。Raw URL 必须一个地址一个独立代码块。

`设置三层场景`

输出并检查：家庭指定 SSID → Home Clean；蜂窝 → Mobile；默认/其它网络 → Mobile。

`安装基础 Toolkit`

输出当前 `main` 的 4 个基础模块，每个 Raw URL 独立代码块。

`MITM 证书设置`

输出独立 CA、iOS 完全信任、本机共享 `JAX MITM Certificate` 的完整操作；禁止让用户发送真实 `ca-p12` / `ca-passphrase`。

### 只读检查与排障

`Shadowrocket 当前状态`

读取 `main`，总结正式配置、两层架构、Toolkit、CI 和近期状态。

`Shadowrocket 全面体检`

综合只读检查 Mobile、Home Clean、规则、策略组、DNS / IPv6 / UDP、WebRTC、MITM、Toolkit、Raw 引用、规则 Fork、CI 与维护风险；输出可继续执行的操作关键词。

`检查 Mobile 配置`

只读检查 `Jax-shadowrocket-v6.conf`。

`检查 Home Clean`

只读检查 `Jax-shadowrocket-home-clean.conf` 与家庭 OpenClash 职责边界。

`检查场景切换`

排查家庭 SSID / 蜂窝 / 默认网络是否进入正确配置。

`5G Mobile 排查`

排查蜂窝模式节点、分流、DNS、MITM、Toolkit 与 YouTube。

`家庭 Wi-Fi 排查`

先区分 Shadowrocket 本机净化层与家庭 OpenClash 网关层，不把代理逻辑塞回 Home Clean。

`检查模块冲突`

检查重复 MITM、重复 YouTube、WebRTC、通用广告模块与 App 专项模块重叠。

`配置安全检查`

检查敏感信息、MITM 范围、外部脚本、DNS / IPv6、Raw 引用与安全边界。

### 规则与节点维护

`同步 ios_rule_script`

执行流程固定为：

1. 比较 `blackmatrix7/ios_rule_script` 上游 `master` 与 `jax2333333/ios_rule_script` 的 `master`；
2. 若 `ahead_by=0` 且仅 `behind`，允许快进到上游当前 SHA；
3. 若 Fork 有独有提交、`ahead` 或 `diverged`，禁止强制覆盖，先检查差异并报告；
4. 同步后重新比较，目标为 `status=identical`、`ahead=0`、`behind=0`；
5. 不把某个历史 SHA 当长期固定值，下次仍重新查询上游。

`优化默认节点选择`

当前长期原则：

- 不把机场具体节点名硬编码为任何长期默认节点；
- `✋ 手动选择` 展示当前订阅实际节点，不固定机场节点名；
- `🧠 智能选择` 使用全节点 `url-test` 自动测速，不设置地区正则；
- 香港、日本、新加坡、美国、台湾等地区智能组各自负责地区过滤和区域优选；
- `🎯 节点选择` 通过 `policy-select-name=🧠 智能选择` 默认选中 `🧠 智能选择`；
- 应用策略组优先提供 `🎯 节点选择`，再按服务需要提供地区智能、`🧠 智能选择` 与 `✋ 手动选择`；
- 修改后不得改变 TikTok / 抖音规则顺序、Apple 直连优先、Home Clean 边界。

`地区智能正则全面检测`

比较 `🧠 智能选择` 与香港、日本、新加坡、美国、台湾地区智能组：确认 `🧠 智能选择` 继续覆盖全部节点，地区智能只做地区归类；检查中英文地名、机场常见缩写和互斥条件，避免跨区误收。默认不额外排除 0.01 / 0.1 倍、免费或试用节点，除非用户明确要求。

`规则源检查`

检查 `jax2333333/ios_rule_script`、JAX 自托管 `rules/`、保留的第三方规则源及 Raw 可访问性。

### Toolkit 与净化

`Toolkit 模块清单`

读取当前 `toolkit/README.md` 与实际目录，输出最新模块 / 脚本清单。

`推荐 Toolkit`

根据当前正式架构推荐常开、按需、备用和不建议重复启用的模块。

`YouTube 去广告`

输出当前 YouTube 模块、MITM 依赖、安装和验收。

`YouTube 去广告排查`

优先检查当前场景 → 本机 CA / 完全信任 → `JAX MITM Certificate` → YouTube 模块 → 再查脚本 / hostname。

`网站净化中心`

读取当前 `site-cleaner.sgmodule` / `site-cleaner.js`，输出支持站点和当前边界。

`添加网站净化`

用户可在关键词后附网站 URL；先分析广告 / 弹窗 / iframe / 跳转，再做最小化规则、Script 与 MITM 增量。

`验证 Bilibili 净化`

围绕首页、竖屏 Feed、直播、播放历史、评论、搜索做 A/B 验证；异常时先关闭 Bilibili 专项模块。

`验证美团净化`

围绕首页、外卖、订单、支付、图片加载做 A/B；不得先扩大到核心业务 API 或整个 `*.meituan.com` MITM。

### 自动检查与知识库

`建立 Shadowrocket 自动体检`

如果 CI 不存在则建立；如果已经存在，则检查 / 加强 `.github/workflows/shadowrocket-ci.yml` 与 `.github/scripts/validate-shadowrocket.mjs`，不得重复创建第二套重叠 CI。

当前 CI 设计目标包括：正式配置长期不变量、Home Clean 边界、Toolkit 数量同步、模块名唯一、禁止 `hostname=*`、禁止 CA 私钥材料、自托管 Raw 引用存在、Toolkit 脚本必须自托管、JavaScript 语法检查。

`检查 Shadowrocket CI`

只读检查最近 Shadowrocket CI 是否运行成功；失败时读取 job / logs 后再给修复关键词。

`更新 Shadowrocket 知识库`

把本次长期有效结论放回正确文档：当前正式规则 → `CURRENT-*`；操作教程 / 关键词 → `OPERATIONS*.md`；历史决策 → `HISTORY*.md`；ChatGPT 行为 → `CHATGPT-MAINTENANCE-PROMPT.md`。不得把四类内容混在一个文件。

## 推荐关键词输出原则

每次“全面体检”或“我还能做什么”后，优先输出 3～8 个与当前状态有关的关键词，例如：

```text
同步 ios_rule_script
```

```text
地区智能正则全面检测
```

```text
检查 Shadowrocket CI
```

已经完成且当前没有变化的操作不要反复作为高优先级推荐；出现新风险、CI 失败、Fork 落后、模块未验证时，再把对应关键词提升到前面。