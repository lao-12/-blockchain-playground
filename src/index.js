#!/usr/bin/env node
// evm-new-token-watcher — read-only watcher for Uniswap-V2-style PairCreated events.
// Zero dependencies: plain fetch JSON-RPC (Node >= 18). No private keys, no trading.
'use strict';
const fs = require('fs');
const path = require('path');

const PRESETS = {
  bsc: { name: 'BSC PancakeSwap V2', rpc: 'https://bsc-rpc.publicnode.com', factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', explorer: 'https://bscscan.com' },
  eth: { name: 'Ethereum Uniswap V2', rpc: 'https://ethereum-rpc.publicnode.com', factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', explorer: 'https://etherscan.io' },
};
const RANGE = Math.max(1, Number(process.env.LOG_RANGE || 20));
const PAIR_CREATED = '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9';

function loadEnv(file = path.join(process.cwd(), '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const v = m[2].replace(/^['"]|['"]$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '-h' || k === '--help') a.help = true;
    else if (k === '--json') a.json = true;
    else if (k.startsWith('--')) a[k.slice(2)] = argv[++i];
  }
  return a;
}

const HELP = `evm-new-token-watcher — watch an EVM chain for new V2 pairs (read-only)

Usage: node src/index.js [options]

Options:
  --preset <bsc|eth>     Use built-in RPC + factory (${Object.entries(PRESETS).map(([k, p]) => k + '=' + p.name).join(', ')})
  --rpc <url>            JSON-RPC URL (env RPC_URL)
  --factory <address>    Uniswap-V2-style factory (env FACTORY)
  --poll <ms>            Poll interval in ms (env POLL_MS, default 3000)
  --from <block>         Start block (default: latest)
  --duration <sec>       Exit after N seconds (default: run forever)
  --json                 Print one JSON object per line
  -h, --help             Show this help

Env (.env supported): RPC_URL, FACTORY, POLL_MS, TG_BOT_TOKEN, TG_CHAT_ID, PRESET, LOG_RANGE (blocks per eth_getLogs, default 20)
`;

let rpcId = 0;
async function rpc(url, method, params) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }) });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
  return j.result;
}

function decodeString(hex) {
  if (!hex || hex === '0x') return '';
  const h = hex.slice(2);
  try {
    if (h.length >= 128) {
      const off = parseInt(h.slice(0, 64), 16) * 2;
      const len = parseInt(h.slice(off, off + 64), 16);
      if (len < 1024) return Buffer.from(h.slice(off + 64, off + 64 + len * 2), 'hex').toString('utf8');
    }
    return Buffer.from(h.slice(0, 64), 'hex').toString('utf8').replace(/\0+$/, ''); // bytes32 tokens (e.g. MKR)
  } catch { return ''; }
}

const meta = new Map();
async function tokenInfo(url, addr) {
  if (meta.has(addr)) return meta.get(addr);
  const call = (data) => rpc(url, 'eth_call', [{ to: addr, data }, 'latest']).catch(() => '0x');
  const [n, s] = await Promise.all([call('0x06fdde03'), call('0x95d89b41')]);
  const info = { name: decodeString(n) || '?', symbol: decodeString(s) || '?' };
  meta.set(addr, info);
  return info;
}

async function notifyTelegram(text) {
  const { TG_BOT_TOKEN, TG_CHAT_ID } = process.env;
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: TG_CHAT_ID, text, disable_web_page_preview: true }) });
  } catch (e) { console.error('[tg] notify failed:', e.message); }
}

const addrFromTopic = (t) => '0x' + t.slice(26);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { process.stdout.write(HELP); return; }
  const preset = PRESETS[(args.preset || process.env.PRESET || '').toLowerCase()];
  const url = args.rpc || process.env.RPC_URL || preset?.rpc;
  const factory = (args.factory || process.env.FACTORY || preset?.factory || '').toLowerCase();
  const pollMs = Number(args.poll || process.env.POLL_MS || 3000);
  const explorer = preset?.explorer;
  if (!url || !/^0x[0-9a-f]{40}$/.test(factory)) { console.error('Missing RPC_URL / FACTORY. Use --preset bsc or see --help.'); process.exit(1); }

  const chainId = parseInt(await rpc(url, 'eth_chainId', []), 16);
  let next = args.from ? Number(args.from) : parseInt(await rpc(url, 'eth_blockNumber', []), 16);
  console.error(`[watch] chainId=${chainId} factory=${factory} from block ${next} every ${pollMs}ms${process.env.TG_BOT_TOKEN ? ' (telegram on)' : ''}`);
  const stopAt = args.duration ? Date.now() + Number(args.duration) * 1000 : Infinity;
  const blockTime = new Map();

  while (Date.now() < stopAt) {
    try {
      const head = parseInt(await rpc(url, 'eth_blockNumber', []), 16);
      while (next <= head) {
        const to = Math.min(head, next + RANGE - 1); // small ranges keep public RPCs happy
        const logs = await rpc(url, 'eth_getLogs', [{ address: factory, topics: [PAIR_CREATED], fromBlock: '0x' + next.toString(16), toBlock: '0x' + to.toString(16) }]);
        for (const log of logs) {
          const token0 = addrFromTopic(log.topics[1]), token1 = addrFromTopic(log.topics[2]);
          const pair = '0x' + log.data.slice(26, 66);
          const block = parseInt(log.blockNumber, 16);
          if (!blockTime.has(block)) { const b = await rpc(url, 'eth_getBlockByNumber', [log.blockNumber, false]); blockTime.set(block, parseInt(b.timestamp, 16)); }
          const [i0, i1] = await Promise.all([tokenInfo(url, token0), tokenInfo(url, token1)]);
          const ev = { chainId, block, time: new Date(blockTime.get(block) * 1000).toISOString(), pair, tx: log.transactionHash, token0: { address: token0, ...i0 }, token1: { address: token1, ...i1 } };
          if (args.json) console.log(JSON.stringify(ev));
          else console.log(`[${ev.time}] block ${block}  ${i0.symbol}/${i1.symbol}\n  pair   ${pair}\n  token0 ${token0}  ${i0.name} (${i0.symbol})\n  token1 ${token1}  ${i1.name} (${i1.symbol})\n  tx     ${ev.tx}`);
          await notifyTelegram(`🆕 New pair ${i0.symbol}/${i1.symbol} (chain ${chainId}, block ${block})\n${i0.name}: ${token0}\n${i1.name}: ${token1}\npair: ${pair}${explorer ? `\n${explorer}/tx/${ev.tx}` : ''}`);
        }
        next = to + 1;
      }
    } catch (e) { console.error('[warn]', e.message); }
    await sleep(pollMs);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
