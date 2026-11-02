'use strict';
const L = require('../renderer/llm.js');
const R = require('../renderer/rules.js');

const KEY = process.env.DEEPSEEK_KEY || '';
if (!KEY) { console.error('请设置环境变量 DEEPSEEK_KEY'); process.exit(1); }
const BASE = 'https://api.deepseek.com/v1';
const MODEL = 'deepseek-v4-flash';

async function main() {
  const input = [
    '赵景深. 文坛忆旧[M]. 上海: 北新书局, 1948: 43.',
    'Heath B. Chamberlain, "On the Search for Civil Society in China," Modern China, Vol. 19, No. 2, 1993, pp. 199-215.'
  ].join('\n');

  const body = {
    model: MODEL,
    messages: L.buildMessages(input),
    temperature: 0,
    response_format: { type: 'json_object' }
  };
  console.log('请求模型:', MODEL, ' 提示词长度:', body.messages[0].content.length);
  const t0 = Date.now();
  const res = await fetch(BASE + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('HTTP', res.status, '耗时', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  if (!res.ok) { console.log(JSON.stringify(data).slice(0, 500)); process.exit(1); }
  const msg = data.choices[0].message;
  console.log('usage:', JSON.stringify(data.usage));
  console.log('reasoning 前80字:', String(msg.reasoning_content || '').slice(0, 80).replace(/\n/g, ' '));
  console.log('content 前200字:', String(msg.content || '').slice(0, 200));
  const parsed = L.extractJson(msg.content);
  if (!parsed) { console.log('!! JSON 解析失败'); process.exit(1); }
  const citations = L.normalize(parsed);
  console.log('识别条数:', citations ? citations.length : 0);
  if (citations) {
    const f = L.filterUnrelated(citations, input);
    console.log('过滤后:', f.citations.length, ' 过滤掉:', f.removed);
    f.citations.forEach((c, i) => {
      console.log('  [' + i + ']', c.lang, c.type, c.ancientSubtype || '', JSON.stringify(c.fields).slice(0, 200));
      console.log('      lsyj:', R.render(c, 'lsyj', {}).text);
    });
  }
}

main().catch(e => { console.error('ERROR', e); process.exit(1); });
