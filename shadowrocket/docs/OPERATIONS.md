# Operations

## 从零恢复 Shadowrocket

1. 从 GitHub `main` 获取当前主配置。
2. 在 Shadowrocket 中导入或更新主配置，确认使用配置规则模式。
3. 按需添加 Toolkit 模块；涉及 MITM 时确认 Shadowrocket 证书已正确安装并信任。
4. 高风险模块逐个启用和测试，不一次性开启全部实验功能。

## 添加或更新 Toolkit 模块

1. 从 `main` 读取当前模块 Raw 地址。
2. 在 Shadowrocket 中打开“配置 → 模块”，新增或更新模块。
3. 断开 Shadowrocket，完全退出目标 App，重连后重新打开 App 验证。
4. 出现异常时先关闭刚更新的模块并做 A/B 验证。

## 修改 GitHub 文档或配置

```text
读取 main 最新文件
→ 检查差异与作用域
→ 最小修改
→ 语法 / 安全 / 规则检查
→ git diff
→ 向用户报告
→ 用户明确授权后 commit / push
→ 重新读取 main 实际结果
```

基础检查：

```bash
git status
git branch --show-current
git pull --ff-only origin main
git diff --check
git diff
```

只暂存用户许可范围内的文件。提交前检查 Token、password、secret、authorization、Cookie、UUID、真实订阅地址和 SSH 私钥头；发现真实凭据立即停止提交。

## 故障回滚

先关闭刚更新的模块。若恢复，保持主配置不动，回退该模块到上一正式 commit，再按日志定位最小修复。
