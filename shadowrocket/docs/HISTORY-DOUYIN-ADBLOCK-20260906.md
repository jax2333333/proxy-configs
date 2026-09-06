# 2026-09-06 抖音广告 / MITM 实测记录

> 本文只记录 2026-09-06 的已验证事实、模块变更依据和后续排障边界。当前正式配置、模块和脚本仍以 GitHub `main` 实际文件为准。

## 测试目标

本轮目标是排查：Shadowrocket 已启用 `tiktok-douyin-adblock.module`，但抖音原生 Feed / 短剧插播广告仍然出现。

重点验证四层：

1. 模块规则是否实际加载；
2. 当前抖音版本真实使用哪些 API / 视频域名；
3. HTTPS MITM / 共享 CA 链路是否工作；
4. 广告是否属于可安全通过 response Script 删除的 JSON 对象，而不是直接封禁视频 CDN。

## 日志样本与结论

### `1111(1).db`

- 文件大小约 `446464` bytes，共 `774` 条 `logging` 记录。
- `dig.bdurl.net` 已命中 `REJECT`，证明 TikTok / 抖音净化模块中的域名规则确实已经加载。
- 同时大量出现 `douyinvod.com`、`dyseries.douyinvod.com`、`douyinpic.com`、`zijieapi.com` 等正常业务链路。
- 结论：域名 REJECT 生效不等于服务器插入的原生视频广告会消失；不能据此封禁正常视频 CDN。

### `22222.db`

- 文件只有 `4096` bytes。
- SQLite header 正常，但没有任何 table / view；同批次 WAL 也没有有效记录。
- 结论：这是无有效连接数据的空导出，不能用于接口判断。以后遇到同类文件应重新复现并完整导出。

### `333333.db`

- 文件大小 `90112` bytes，共 `286` 条 `logging` 记录。
- 捕获 `api.amemv.com` 3 次：`08:49:56`、`08:50:05`、`08:51:39`。
- 同一窗口存在 `dyseries.douyinvod.com` / `douyinvod.com` 视频连接。
- 当时 `api.amemv.com` 仍以 `api.amemv.com:443` + `TCP Stream` 的连接级形式出现，没有直接证明抖音 App 的 response Script 已取得响应正文。

### `3(1).db`

- 文件大小 `81920` bytes，共 `294` 条 `logging` 记录。
- `09:04:01` 捕获 `aweme.snssdk.com:443`。
- `09:04:03` 紧接出现 `v96-dyseries.douyinvod.com:443`。
- 该时间相关性不足以证明 `aweme.snssdk.com` 就是广告专用接口，但足以证明当前抖音版本会在短剧 / Feed 场景使用该精确主机名。
- 因此允许把 **精确的** `aweme.snssdk.com` 加入专项 response Script / MITM；不扩大到 `*.snssdk.com`。

### `3.1(1).db`

- 文件大小 `225280` bytes，共 `560` 条 `logging` 记录。
- 本轮没有出现 `*.amemv.com` 或 `aweme.snssdk.com`。
- 捕获 `31` 条 `http://111.31.36.96/trace/v3` 请求，User-Agent 为 `KCG-PD/3.0.35.7`。
- 请求参数中明确包含多个 `playurl_host=...dyseries.douyinvod.com`、`playtype=vod`、`group_tag=ios_udp_v0g1` 等播放 / CDN 探测信息。
- 结论：`111.31.36.96/trace/v3` 属于播放链路探测 / 调度类流量，关联大量正常短剧视频地址，**不能作为广告专用端点直接 REJECT**。

## v4 模块变更

基于上述实测，`shadowrocket/toolkit/modules/tiktok-douyin-adblock.module` 于 2026-09-06 升级到 v4。

提交：

```text
248d07925fe870a20e0b1bc94f935ee69c62c8ac
```

v4 的 response Script / MITM 范围固定为：

```text
*.amemv.com
aweme.snssdk.com
```

设计边界：

- 保留原 `*.amemv.com`；
- 仅新增实测出现的精确 `aweme.snssdk.com`；
- 不使用 `*.snssdk.com`；
- 不扩大到 `*.zijieapi.com`；
- 不封 `douyinvod.com` / `dyseries.douyinvod.com`；
- 继续只删除 JSON 中具有强广告标记的内容对象，解析失败必须 fail-open。

## MITM 主动验证：已确认浏览器链路正常

本轮在 Home Clean 场景下使用浏览器主动访问：

```text
https://api.amemv.com/
```

Shadowrocket 日志随后可以看到完整 HTTPS URL，例如：

```text
https://api.amemv.com/favicon.ico
```

同时可以看到浏览器完整 User-Agent，而不再只是 `api.amemv.com:443` + `TCP Stream`。

这说明在该次浏览器测试中：

```text
JAX MITM Certificate
+ iOS 完全信任
+ tiktok-douyin-adblock.module 的 *.amemv.com hostname
+ Home Clean FINAL,DIRECT
```

能够共同工作，Shadowrocket 已经取得该 HTTPS 请求的 HTTP 层可见性。**Home Clean 的 `FINAL,DIRECT` 本身不会阻止 MITM。**

### 重要限制

浏览器主动测试只能证明：

- 当前共享 CA 可用；
- `*.amemv.com` hostname 匹配可用；
- 当前场景的 Shadowrocket MITM 基础链路可用。

它**不能单独证明抖音 App 自身的每一条 HTTPS 流量都会被成功解密**。如果 App 对某接口使用证书固定、QUIC/UDP、不同主机名或其它传输路径，仍可能只看到连接级日志而没有 response Script 可处理的响应正文。

因此以后不要把“Safari 可 MITM”直接等同于“抖音 App response Script 一定已经执行”。

## 当前状态（本轮测试结束）

截至本轮结束：

- ✅ 模块域名 REJECT 已确认生效；
- ✅ Home Clean 下共享 CA / `*.amemv.com` 浏览器 MITM 链路已确认可用；
- ✅ v4 已加入精确 `aweme.snssdk.com`；
- ✅ 已确认 `douyinvod.com` / `dyseries.douyinvod.com` 不能粗暴封禁；
- ✅ 已确认 `111.31.36.96/trace/v3` 不能作为广告专用端点直接封禁；
- ⚠️ **抖音原生 Feed / 短剧广告是否已被 v4 稳定移除，尚未完成最终验收。**

因此 v4 当前状态应视为“基于实测扩大最小接口覆盖后的实验版本”，而不是“已经证明 100% 去除抖音广告”。

## 后续复现固定流程

若以后继续出现抖音 Feed / 短剧广告：

1. 先确认当前 `main` 的 `tiktok-douyin-adblock.module` / `douyin-feed-adblock.js`，禁止根据聊天旧代码修改。
2. 清空 Shadowrocket 日志，完全退出抖音，再重新打开并只复现一个广告场景。
3. 导出有效 `.db`；若约 4096 bytes 且没有 table/view，直接判为无效导出并重抓。
4. 优先寻找完整 HTTPS URL / Script 日志，而不是只看 Host:443。
5. 若 `api*.amemv.com` / `aweme.snssdk.com` 已有 HTTP 层可见性但广告仍存在，再分析 JSON 广告标记是否超出当前脚本识别范围。
6. 若目标 API 完全不出现，再找新的明确 Feed / 剧集 API；只增加精确主机名，不扩大整个字节共享域。
7. 不把 `douyinvod.com`、`dyseries.douyinvod.com`、`111.31.36.96` 作为默认 REJECT 修复手段。

## 长期安全边界

- TikTok 地区 / 账号稳定仍优先于抖音去广告实验。
- 禁止 `hostname=*`。
- 禁止仅凭时间相关性把共享 ByteDance 域名判定为广告域名。
- 正常视频 CDN 同时承载正片和广告时，不做 CDN 级封锁。
- Script 默认 fail-open，不主动外发 Cookie、Header、Token、账号或播放凭据。
