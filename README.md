# evm-new-token-watcher

> Zero-dependency Node.js CLI that watches any EVM chain for newly created Uniswap-V2-style pairs and tells you (and optionally Telegram) the moment a new token gets a pool.

[中文文档](./README.zh-CN.md)

## Features
- Works on any EVM chain with a V2-style factory: BSC, Ethereum, Base, HyperEVM, Arbitrum…
- Built-in presets: `bsc` (PancakeSwap V2) and `eth` (Uniswap V2)
- Prints token address, name, symbol, pair, block, time and tx (human or `--json` lines)
- Optional Telegram notification via bot token + chat ID
- **Zero dependencies** — plain `fetch` JSON-RPC, Node ≥ 18
- **Read-only** — no private keys, no trading, nothing signed

## Quick start
```bash
git clone https://github.com/lao-12/-blockchain-playground.git
cd -blockchain-playground
npm install            # nothing to download, sanity only
node src/index.js --preset bsc
# or configure everything via .env
cp .env.example .env && node src/index.js
```
Other options: `--rpc <url> --factory <addr> --poll <ms> --from <block> --duration <sec> --json` (see `--help`).

## Configuration
| Variable | Description | Default |
|---|---|---|
| `PRESET` | `bsc` or `eth` (fills RPC + factory) | – |
| `RPC_URL` | JSON-RPC endpoint | preset RPC |
| `FACTORY` | V2 factory address | preset factory |
| `POLL_MS` | Poll interval (ms) | `3000` |
| `LOG_RANGE` | Blocks per `eth_getLogs` call | `20` |
| `TG_BOT_TOKEN` | Telegram bot token (optional) | – |
| `TG_CHAT_ID` | Telegram chat ID (optional) | – |

Presets: BSC PancakeSwap V2 `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`, Ethereum Uniswap V2 `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`.
For other chains pass `--rpc` and `--factory` of that chain's V2 DEX.

## Example output
Real output captured on BSC mainnet (2026-11-05):
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

## Roadmap
- [ ] More presets (Base, Arbitrum, HyperEVM DEXes)
- [ ] Uniswap V3 `PoolCreated` support
- [ ] WebSocket subscriptions instead of polling
- [ ] Filters (quote token only WBNB/WETH, name regex)
- [ ] Basic honeypot / liquidity checks (read-only)
- [ ] Discord / generic webhook

## Contributing
Issues and PRs welcome. Keep it small and dependency-free; please test against a public RPC before submitting.

## Disclaimer
For research and education. New tokens are frequently scams — nothing here is financial advice.

## License
MIT © 2026 lao-12
