# Proxy Config Manager Skill

A portable Agent Skill for maintaining JAX's Shadowrocket, Clash Verge, and OpenClash configurations in `jax2333333/proxy-configs`.

## Structure

```text
proxy-config-manager/
├── SKILL.md
├── README.md
├── assets/
│   └── change-report-template.md
└── references/
    ├── common-rules.md
    ├── security-rules.md
    ├── repo-layout.md
    ├── shadowrocket.md
    ├── clash-verge.md
    ├── openclash.md
    └── test-cases.md
```

## Install

Upload the `proxy-config-manager` folder or its ZIP package to a client that supports the Agent Skills format. In ChatGPT surfaces where Skills are available, use the Skills/Plugins area and choose the upload/create flow provided by the product.

For direct GitHub maintenance, the client also needs authenticated GitHub repository access with the appropriate permissions.

## Design

This package is intentionally one installable skill with three platform-specific reference modules. That preserves a single routing entry point while allowing progressive disclosure: the agent loads only the platform rules needed for the current task.
