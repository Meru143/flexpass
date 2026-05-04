# Security Policy

FlexPass handles membership ownership, marketplace escrow, and MATIC settlement. Security reports should include enough detail to reproduce the issue locally with Foundry or the dApp test suite.

## Responsible Disclosure

Email security reports to `security@flexpass.dev`. If that mailbox is unavailable during the private beta, open a private GitHub Security Advisory on the repository and include a minimal proof of concept, affected contracts or packages, expected impact, and suggested remediation if known.

Do not disclose a vulnerability publicly until maintainers confirm a fix or provide a disclosure timeline. Do not test against production wallets, user funds, or third-party gym accounts without explicit written permission.

## Known Limitations

ERC-2981 royalties are enforced inside `FlexPassMarket`, where the contract pays the gym treasury before seller settlement. External NFT marketplaces may choose not to enforce ERC-2981 royalty payments if a member transfers or lists the NFT outside FlexPass. This is the v1 limitation described in PRD Edge Case #10.

The v1 design preserves ERC-721 transferability instead of blocking transfers through an allowlist. Integrators should direct members to the FlexPass marketplace when resale royalty enforcement is required.

## Audit Status

Independent audit report: pending.

Placeholder link: `https://github.com/Meru143/flexpass/security/advisories`

Before mainnet launch, publish the completed audit report here, list resolved findings, and document any accepted residual risks.

