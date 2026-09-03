# Clash Verge 从零安装与恢复

## 目标

使用 GitHub `main` 托管公共 Mihomo 配置，同时把真实机场订阅地址只保存在 Clash Verge 本地 Merge。这样换电脑或重装时，不需要把秘密上传到 GitHub。

## 1. 获取正式配置

正式 Raw 地址：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/clash-verge/clash-verge-by-jax.yaml
```

不要使用旧 Gist 或固定到历史 revision/commit 的旧链接作为日常正式入口。

## 2. 在 Clash Verge 添加远程配置

在 Clash Verge Rev 中新建 Remote / 远程配置，填写上面的 Raw 地址。

应用 UI 名称可能随版本变化，因此不要把旧截图中的菜单文字当作永久事实。核心原则是：

```text
GitHub Raw YAML
      ↓
Clash Verge Remote 配置
```

保存并更新后，此时 GitHub 模板**不会包含真实机场节点订阅**。

## 3. 添加本地订阅 Merge

对这条远程配置添加“订阅扩展配置 / Merge”（名称可能随 Clash Verge 版本调整）。

本地示例：

```yaml
proxy-providers:
  Airport1:
    type: http
    url: "<仅在本机填写真实机场订阅地址>"
    interval: 86400
    health-check:
      enable: true
      url: https://www.gstatic.com/generate_204
      interval: 300
      lazy: true
```

注意：

- 真实 URL 不上传 GitHub。
- 不粘贴到公开 Issue、截图、README 或 commit message。
- 如果 Provider 名称以后改变，先读最新 `clash-verge-by-jax.yaml`，不要机械沿用 `Airport1`。

## 4. 最终合并关系

```text
GitHub 公共 YAML
       +
Clash Verge 本地 Merge
       ↓
最终 Mihomo 配置
```

GitHub YAML 中的 Provider 型策略组依靠 `include-all-providers` 接收本地 Merge 注入的机场节点。

## 5. 启用后检查

打开 Clash Verge 的代理/策略页面，确认：

- 主节点选择组可见。
- 全部节点/智能选择能看到机场 Provider 节点。
- 香港、日本、新加坡、美国地区组有符合名称筛选的节点。
- `🇨🇳 国内流量` 可见。
- `🐟 漏网之鱼` 可见。
- AI、Google、GitHub、YouTube 等访问后日志能命中对应组。

具体策略组列表与顺序以最新 YAML 为准。

## 6. 基础运行验证

建议检查日志是否出现：

```text
Start initial configuration
Start initial provider ...
Tun adapter listening ...
```

再用实际访问验证：

- ChatGPT / OpenAI → AI 组。
- GitHub → GitHub 组。
- YouTube → YouTube 组。
- Google → Google / 主节点选择路径。
- 中国大陆域名 → `🇨🇳 国内流量`。
- 未分类国外服务 → `🐟 漏网之鱼`。

运行时用户手动选择会改变最终具体节点，这是正常的。

## 7. 换电脑 / 重装恢复

恢复时只需：

1. 安装 Clash Verge Rev。
2. 导入 GitHub Raw 配置。
3. 在本机重新创建本地 Merge。
4. 填入当前有效的机场订阅 URL。
5. 更新远程配置。
6. 启用 TUN / 系统代理并查看日志。
7. 按 `TROUBLESHOOTING.md` 做基础验证。

GitHub 不保存真实机场 URL，因此**仅克隆仓库不能恢复机场认证信息**，这是安全设计，不是缺失。

## 8. 日常更新

### 修改规则 / DNS / 策略组

只修改 GitHub `main` 中：

```text
clash-verge/clash-verge-by-jax.yaml
```

然后让 Clash Verge 更新远程配置。

### 机场订阅更换

只修改本机 Merge 中的 Provider URL；GitHub 无需变化。

## 9. 安全事故恢复

如果真实机场订阅 URL 曾经出现在公开 GitHub / Gist / 截图：

1. 在机场后台重置/重新生成订阅链接。
2. 不再使用旧地址。
3. 新地址只保存到本地 Merge。
4. 检查 GitHub 当前文件与提交内容，不要再次完整粘贴秘密。

不要认为“删除当前文件中的秘密”就一定消除了历史泄露风险。

## 10. 配置与运行值不一致

如果 YAML 写的是一个 TUN stack / 端口，但日志显示其他值：

- 先检查 Clash Verge 的全局设置。
- 检查订阅 Merge / Override。
- 检查最终运行日志。
- 不要先修改 GitHub YAML。

Clash Verge 可能在启动时对远程 YAML 继续做本地覆写。
