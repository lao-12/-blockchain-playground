# evm-new-token-watcher

> 零依赖的 Node.js 命令行工具：监听任意 EVM 链上 Uniswap-V2 类工厂合约的新交易对，新币一建池立刻打印（可选推送到 Telegram）。

[English](./README.md)

## 功能
- 支持任何有 V2 类工厂的 EVM 链：BSC、以太坊、Base、HyperEVM、Arbitrum…
- 内置预设：`bsc`（PancakeSwap V2）、`eth`（Uniswap V2）
- 输出代币地址、名称、符号、交易对、区块、时间、交易哈希（可 `--json` 逐行输出）
- 可选 Telegram 通知
- **零依赖**：原生 `fetch` 调用 JSON-RPC，Node ≥ 18
- **只读**：不需要私钥，不交易，不签名

## 快速开始
```bash
git clone https://github.com/lao-12/-blockchain-playground.git
cd -blockchain-playground
npm install
node src/index.js --preset bsc
# 或者用 .env 配置
cp .env.example .env && node src/index.js
```
其他参数：`--rpc <url> --factory <地址> --poll <毫秒> --from <区块> --duration <秒> --json`（见 `--help`）。

## 配置
| 变量 | 说明 | 默认值 |
|---|---|---|
| `PRESET` | `bsc` 或 `eth`（自动填 RPC 和工厂） | – |
| `RPC_URL` | JSON-RPC 地址 | 预设 RPC |
| `FACTORY` | V2 工厂合约地址 | 预设工厂 |
| `POLL_MS` | 轮询间隔（毫秒） | `3000` |
| `LOG_RANGE` | 每次 `eth_getLogs` 的区块数 | `20` |
| `TG_BOT_TOKEN` | Telegram 机器人 Token（可选） | – |
| `TG_CHAT_ID` | Telegram 聊天 ID（可选） | – |

预设：BSC PancakeSwap V2 `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`，以太坊 Uniswap V2 `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`。其他链请传入该链 V2 DEX 的 `--rpc` 和 `--factory`。

## 输出示例
2026-11-05 在 BSC 主网实测输出：
```
[watch] chainId=56 factory=0xca143ce32fe78f1f7019d7d551a6402fc5350c73 from block 131810311 every 2000ms
[2026-11-05T11:39:44.000Z] block 131810316  WBNB/DSIG
  pair   0xd9282c024bb822f6881fd0be57df781e38a31d3a
  token0 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c  Wrapped BNB (WBNB)
  token1 0xed46433996beccef177bd905efde0191e9e57bd9  DeepSignal (DSIG)
  tx     0x5db6796f13b92b5f9301f56fe04c0e8af9635bb7e2b24264d8f3ca5032de6e56
[2026-11-05T11:40:40.000Z] block 131810439  1WIN/WBNB
  pair   0x49b16b97d8e0f2f3310e6913de65baefa851bb52
  token0 0x8008f5677583795f0033e1c08c7bc56db72d1422  1win Token (1WIN)
  token1 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c  Wrapped BNB (WBNB)
  tx     0x854ef90ac742165983e65c9c36a0c8c65d11d83d248b82a7a6c5c74b5b456ca4
```

## 路线图
- [ ] 更多预设（Base、Arbitrum、HyperEVM 上的 DEX）
- [ ] 支持 Uniswap V3 `PoolCreated`
- [ ] WebSocket 订阅替代轮询
- [ ] 过滤（只看 WBNB/WETH 交易对、名称正则）
- [ ] 基础貔貅/流动性检测（只读）
- [ ] Discord / 通用 Webhook

## 参与贡献
欢迎提 Issue 和 PR。请保持精简、零依赖，提交前用公共 RPC 测一下。

## 免责声明
仅供研究学习。新币大量是骗局，本项目不构成任何投资建议。

## 许可证
MIT © 2026 lao-12
