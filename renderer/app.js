'use strict';
(function () {
  var R = window.Rules;
  var L = window.Llm;

  var settings = null;
  var currentFormat = 'lsyj';
  var lastCitations = null;
  var busy = false;

  var $ = function (id) { return document.getElementById(id); };
  var inputArea = $('inputArea');
  var outputArea = $('outputArea');
  var summaryArea = $('summaryArea');
  var statusBar = $('statusBar');
  var convertBtn = $('convertBtn');
  var copyAllBtn = $('copyAllBtn');
  var settingsModal = $('settingsModal');

  var PRESETS = {
    deepseek: { baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-v4-flash' },
    kimi: { baseURL: 'https://api.moonshot.cn/v1', model: 'kimi-latest' },
    qwen: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
    openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }
  };

  var LANG_NAMES = { zh: '中文', en: '英文', ja: '日文', other: '其他语种' };

  function setStatus(msg, isErr) {
    statusBar.textContent = msg;
    statusBar.style.color = isErr ? '#c62828' : '';
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------- 设置 ----------
  function fillSettingsForm() {
    $('baseURLInput').value = settings.baseURL || '';
    $('modelInput').value = settings.model || '';
    $('apiKeyInput').value = settings.apiKey || '';
    $('tempInput').value = settings.temperature !== undefined ? settings.temperature : 0;
    $('jsonModeInput').checked = settings.jsonMode !== false;
    $('presetSel').value = '';
    $('settingsMsg').textContent = '';
    $('settingsMsg').className = 'settings-msg';
  }

  function readSettingsForm() {
    return {
      baseURL: $('baseURLInput').value.trim(),
      model: $('modelInput').value.trim(),
      apiKey: $('apiKeyInput').value.trim(),
      temperature: parseFloat($('tempInput').value) || 0,
      jsonMode: $('jsonModeInput').checked
    };
  }

  $('settingsBtn').addEventListener('click', function () {
    fillSettingsForm();
    settingsModal.classList.remove('hidden');
  });
  $('settingsClose').addEventListener('click', function () {
    settingsModal.classList.add('hidden');
  });
  settingsModal.addEventListener('click', function (e) {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  $('presetSel').addEventListener('change', function () {
    var p = PRESETS[this.value];
    if (p) {
      $('baseURLInput').value = p.baseURL;
      $('modelInput').value = p.model;
    }
  });

  $('saveBtn').addEventListener('click', async function () {
    settings = readSettingsForm();
    if (!settings.baseURL || !settings.model || !settings.apiKey) {
      $('settingsMsg').textContent = 'baseURL / 模型 / API Key 不能为空';
      $('settingsMsg').className = 'settings-msg err';
      return;
    }
    await window.bridge.setSettings(settings);
    $('settingsMsg').textContent = '已保存';
    $('settingsMsg').className = 'settings-msg ok';
    setTimeout(function () { settingsModal.classList.add('hidden'); }, 500);
  });

  $('testBtn').addEventListener('click', async function () {
    var s = readSettingsForm();
    if (!s.baseURL || !s.model || !s.apiKey) {
      $('settingsMsg').textContent = '请先填写 baseURL / 模型 / API Key';
      $('settingsMsg').className = 'settings-msg err';
      return;
    }
    $('settingsMsg').textContent = '测试中…';
    $('settingsMsg').className = 'settings-msg';
    try {
      await window.bridge.chat({
        baseURL: s.baseURL, model: s.model, apiKey: s.apiKey,
        temperature: 0, jsonMode: false,
        messages: [{ role: 'user', content: 'ping' }]
      });
      $('settingsMsg').textContent = '连接成功';
      $('settingsMsg').className = 'settings-msg ok';
    } catch (e) {
      $('settingsMsg').textContent = '连接失败：' + e.message;
      $('settingsMsg').className = 'settings-msg err';
    }
  });

  // ---------- 格式切换 ----------
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentFormat = tab.getAttribute('data-format');
      localStorage.setItem('cc-format', currentFormat);
      if (lastCitations) renderAll();
    });
  });

  // ---------- 转换 ----------
  convertBtn.addEventListener('click', convert);
  inputArea.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') convert();
  });
  inputArea.addEventListener('input', function () {
    localStorage.setItem('cc-input', inputArea.value);
  });

  async function convert() {
    if (busy) return;
    var input = inputArea.value.trim();
    if (!input) {
      setStatus('请先粘贴引注信息', true);
      return;
    }
    if (!settings || !settings.apiKey) {
      setStatus('请先在设置中填写 API Key', true);
      $('settingsModal').classList.remove('hidden');
      return;
    }
    busy = true;
    convertBtn.disabled = true;
    setStatus('识别中…');
    outputArea.innerHTML = '<div class="placeholder">识别中，请稍候…</div>';
    summaryArea.classList.add('hidden');
    try {
      var citations = null;
      var apiOk = true;
      var filteredMsg = '';
      try {
        var messages = L.buildMessages(input);
        var content = await window.bridge.chat({
          baseURL: settings.baseURL,
          model: settings.model,
          apiKey: settings.apiKey,
          messages: messages,
          temperature: settings.temperature,
          jsonMode: settings.jsonMode
        });
        var parsed = L.extractJson(content);
        var normalized = parsed ? L.normalize(parsed) : null;
        if (!normalized) {
          citations = L.fallbackParse(input);
          if (!citations) throw new Error('AI 返回内容无法解析为引注数据，且本地兜底解析失败');
          apiOk = false;
        } else {
          var fRes = L.filterUnrelated(normalized, input);
          citations = fRes.citations;
          if (!citations.length) {
            throw new Error('AI 返回的条目与输入内容不符，已全部过滤。请重试或更换模型。');
          }
          if (fRes.removed > 0) {
            filteredMsg = '；已过滤 ' + fRes.removed + ' 条与输入无关的条目';
          }
        }
      } catch (e) {
        console.error('AI 解析失败:', e);
        if (!citations || !citations.length) {
          citations = L.fallbackParse(input);
          if (!citations) throw e;
        }
        apiOk = false;
      }
      lastCitations = R.markDuplicates(citations);
      renderAll();
      if (!apiOk) {
        setStatus('已使用本地兜底解析（AI 接口不可用），结果可能不完整', true);
      } else {
        setStatus('完成，共识别 ' + lastCitations.length + ' 条引注' + filteredMsg);
      }
    } catch (e) {
      setStatus('转换失败：' + e.message, true);
      outputArea.innerHTML = '<div class="placeholder">转换失败，请查看底部状态信息</div>';
    } finally {
      busy = false;
      convertBtn.disabled = false;
    }
  }

  // ---------- 渲染 ----------
  function buildRows(c, idx) {
    var rows = [];
    var it = R.renderInText(c, currentFormat);
    if (currentFormat === 'lsyj') {
      var journalZh = c.lang === 'zh' && c.type === 'journal';
      var main = R.render(c, 'lsyj', journalZh ? { omitPages: true } : {});
      rows.push({ label: journalZh ? '完整脚注（引用文章）' : '完整脚注', res: main, primary: true });
      if (journalZh) {
        rows.push({ label: '完整脚注（引用观点·加页码）', res: R.render(c, 'lsyj', {}) });
      }
      rows.push({ label: '再次引用简式', res: R.render(c, 'lsyj', { simple: true }) });
    } else if (currentFormat === 'gbt') {
      var num = (c.duplicateOf !== null && c.duplicateOf !== undefined) ? c.duplicateOf + 1 : idx + 1;
      var ref = R.render(c, 'gbt', {});
      rows.push({ label: '文内标注（顺序编码制）', text: '[' + num + ']', hint: '上标标注于引文处' });
      rows.push({ label: '文内引用（著者-出版年制）', text: it.authYear });
      rows.push({ label: '参考文献条目', prefix: '[' + num + '] ', res: ref, primary: true });
    } else if (currentFormat === 'apa') {
      rows.push({ label: '文内引用（括注式）', text: it.paren });
      rows.push({ label: '文内引用（叙述式）', text: it.narrative });
      rows.push({ label: '参考文献条目', res: R.render(c, 'apa', {}), primary: true });
    } else {
      rows.push({ label: '文内引用（括注式）', text: it.paren });
      rows.push({ label: '文内引用（叙述式）', text: it.narrative });
      rows.push({ label: '文献列表条目', res: R.render(c, 'mla', {}), primary: true });
    }
    rows.forEach(function (r) {
      r.fullText = r.res ? (r.prefix || '') + r.res.text : r.text;
    });
    return rows;
  }

  function typeLabel(c) {
    if (c.type === 'ancient' && c.ancientSubtype) {
      return R.ANCIENT_LABELS[c.ancientSubtype] || R.TYPE_LABELS.ancient;
    }
    return R.TYPE_LABELS[c.type] || c.type;
  }

  function renderAll() {
    outputArea.innerHTML = '';
    if (!lastCitations || !lastCitations.length) {
      outputArea.innerHTML = '<div class="placeholder">没有识别到引注</div>';
      copyAllBtn.disabled = true;
      return;
    }
    var missingByCard = [];
    lastCitations.forEach(function (c, i) {
      var rows = buildRows(c, i);
      outputArea.appendChild(buildCard(c, i, rows));
      rows.forEach(function (r) {
        if (!r.res) return;
        var missKeys = [];
        r.res.segments.forEach(function (s) {
          if (s.m) {
            var m = String(s.v).match(/【缺：(.+?)】/);
            if (m && missKeys.indexOf(m[1]) < 0) missKeys.push(m[1]);
          }
        });
        if (missKeys.length) missingByCard[i] = (missingByCard[i] || []).concat(missKeys);
      });
    });
    copyAllBtn.disabled = false;
    var lines = [];
    missingByCard.forEach(function (arr, i) {
      if (arr && arr.length) {
        var uniq = arr.filter(function (v, j) { return arr.indexOf(v) === j; });
        lines.push('第 ' + (i + 1) + ' 条：' + uniq.join('、'));
      }
    });
    if (lines.length) {
      summaryArea.classList.remove('hidden');
      summaryArea.innerHTML = '<b>缺失信息提醒</b><br>' +
        lines.map(escapeHtml).join('<br>') +
        '<br>请补充缺失信息后重新转换，或直接手动修改输出。';
    } else {
      summaryArea.classList.add('hidden');
    }
  }

  function appendSeg(el, s) {
    var node;
    if (s.m) {
      node = document.createElement('span');
      node.className = 'miss';
      node.textContent = s.v;
    } else if (s.u) {
      node = document.createElement('span');
      node.className = 'unc';
      node.textContent = s.v;
    } else if (s.i) {
      node = document.createElement('em');
      node.textContent = s.v;
    } else {
      node = document.createTextNode(s.v);
    }
    el.appendChild(node);
  }

  function buildCard(c, idx, rows) {
    var card = document.createElement('div');
    card.className = 'card';

    var head = document.createElement('div');
    head.className = 'card-head';
    head.innerHTML =
      '<span class="badge">' + escapeHtml(typeLabel(c)) + '</span>' +
      '<span class="lang">' + escapeHtml(LANG_NAMES[c.lang] || c.lang) + '</span>' +
      '<span class="idx">#' + (idx + 1) + '</span>';
    card.appendChild(head);

    var body = document.createElement('div');
    body.className = 'card-body rows';
    rows.forEach(function (r, ri) {
      var row = document.createElement('div');
      row.className = 'row';
      if (ri === 0) row.classList.add('first');

      var label = document.createElement('div');
      label.className = 'row-label';
      label.textContent = r.label;

      var text = document.createElement('div');
      text.className = 'row-text';
      if (r.res) {
        if (r.prefix) text.appendChild(document.createTextNode(r.prefix));
        r.res.segments.forEach(function (s) { appendSeg(text, s); });
      } else {
        text.textContent = r.text;
        if (r.hint) {
          var hint = document.createElement('span');
          hint.className = 'hint';
          hint.textContent = '（' + r.hint + '）';
          text.appendChild(hint);
        }
      }

      var btn = document.createElement('button');
      btn.className = 'btn small copy';
      btn.textContent = '复制';
      btn.addEventListener('click', function () {
        copyText(r.fullText, btn);
      });

      row.appendChild(label);
      row.appendChild(text);
      row.appendChild(btn);
      body.appendChild(row);
    });
    card.appendChild(body);

    var notes = [];
    rows.forEach(function (r) {
      if (r.res && r.res.notes) notes = notes.concat(r.res.notes);
    });
    notes = notes.filter(function (v, j) { return notes.indexOf(v) === j; });
    if (notes.length) {
      var foot = document.createElement('div');
      foot.className = 'card-foot';
      var nd = document.createElement('div');
      nd.className = 'notes';
      nd.textContent = '⚠ ' + notes.join('；');
      foot.appendChild(nd);
      card.appendChild(foot);
    }
    return card;
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
      if (btn) {
        var old = btn.textContent;
        btn.textContent = '已复制';
        setTimeout(function () { btn.textContent = old; }, 1200);
      }
    }).catch(function () {
      setStatus('复制失败，请手动复制', true);
    });
  }

  copyAllBtn.addEventListener('click', function () {
    if (!lastCitations) return;
    var lines = [];
    lastCitations.forEach(function (c, i) {
      buildRows(c, i).forEach(function (r) {
        if (r.primary) lines.push(r.fullText);
      });
    });
    copyText(lines.join('\n'), copyAllBtn);
  });

  // ---------- 启动 ----------
  async function init() {
    settings = await window.bridge.getSettings();
    var fmt = localStorage.getItem('cc-format');
    if (fmt && R.FORMATS.indexOf(fmt) >= 0) currentFormat = fmt;
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-format') === currentFormat);
    });
    var savedInput = localStorage.getItem('cc-input');
    if (savedInput) inputArea.value = savedInput;
  }

  init().catch(function (e) {
    setStatus('初始化失败：' + e.message, true);
  });
})();
