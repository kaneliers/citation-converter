(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Llm = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FIELD_KEYS = [
    'authors', 'authorRole', 'title', 'titleSc', 'containerTitle', 'partTitle',
    'publisher', 'pubPlace', 'pubYear', 'pages', 'translator', 'editor',
    'editorRole', 'collator', 'organizer', 'volume', 'issue', 'version',
    'edition', 'institution', 'degree', 'date', 'archiveNo', 'archivePlace',
    'url', 'accessDate', 'seriesName', 'seriesPlace', 'seriesPublisher',
    'seriesYear', 'seriesVolume', 'department', 'column', 'physicalPart',
    'dynastyYear', 'dynastyDate', 'conferenceName', 'conferencePlace',
    'originalInfo', 'quoteAuthor', 'quoteTitle', 'quotePlace', 'quotePublisher',
    'quoteYear', 'quotePages', 'quoteVolume', 'extra', 'seePrefix',
    'volumeUnit', 'issueUnit'
  ];

  var SYSTEM_PROMPT = [
    '你是一个学术引注识别引擎。用户会粘贴一段文本，其中可能包含一条或多条引注信息（来源格式不限：APA、MLA、GB/T 7714、《历史研究》、Chicago、知网导出、百度学术，甚至是自由书写的文献描述，也可能是混合多条）。',
    '你的任务：把文本拆分为若干条独立引注，对每条抽取结构化字段。',
    '输出必须是严格的 JSON 对象，格式：',
    '{"citations":[{"lang":"zh|en|ja|other","type":"book|chapter|preface|journal|newspaper|thesis|conference|archive|diary|quoted|web|ancient","ancientSubtype":"keben|dianjiao|yingyin|chapter|gazetteer|classic|biannian(仅当type=ancient时)","fields":{...},"missing":["缺字段名..."],"uncertain":["不确定字段名..."]}]}',
    '字段定义（fields 对象里只放你能从原文中找到的字段，找不到就不要放；所有值均为字符串，authors 为字符串数组）：',
    '- authors: 作者/责任者名单数组（中文名保留原样，如["赵景深"]；多个作者拆开）',
    '- authorRole: 责任方式：著/主编/编/编著/译/点校/整理/辑/ed/eds 等（"著"可省略不填）',
    '- title: 文献题名（不含书名号，不含卷次）',
    '- titleSc: 仅英文文献填写——题名的 sentence case 版本（首词大写，专有名词保留大写，其余小写；副标题冒号后首词大写）',
    '- containerTitle: 文集名/期刊名/报纸名/丛书所属文集名',
    '- partTitle: 古籍或析出文献中的篇名/部类名（如"玄宗纪下"、"服章部七"）',
    '- publisher: 出版者（多个出版社用"、"连接）',
    '- pubPlace: 出版地点',
    '- pubYear: 出版时间/年份（保留原文写法，如"1948"、"1998年"、"1976年1月"、"不详"）',
    '- pages: 被引用的页码（如"43"、"247—266"、"9页a"、"6章"；起止页码用原文连接符）',
    '- translator: 译者；collator: 点校者；organizer: 整理者；editor: 编者（单人或多人"、"连接）；editorRole: 编者责任方式（编/主编/辑/eds 等）',
    '- volume: 卷/册/集序号（只填数字或"第X册"样式的整体，如"31"、"69册"）；volumeUnit: 卷/册/集；issue: 期号；issueUnit: 期/号',
    '- version: 古籍版本（如"光绪三年苏州文学山房活字本"、"标点本"）；edition: 版次（如"增补本"、"2nd ed."）',
    '- degree: 博士/硕士；institution: 学位授予单位',
    '- date: 报纸日期/档案日期/日记日期（保留原文写法，如"1986年8月22日"、"February 1, 1969"、"光绪二十六年十一月二十一日"）',
    '- archiveNo: 卷宗号/档号/盒号；archivePlace: 档案藏所',
    '- url: 网址；accessDate: 访问时间',
    '- seriesName: 丛书名（不含书名号）；seriesPlace/seriesPublisher/seriesYear: 丛书出版信息；seriesVolume: 丛书册数（如"88"）；department: 部类（如"子部"、"史部"、"综录类"）',
    '- physicalPart: 册别（如"上册"、"下册"）；column: 栏目/栏位（如"下栏"、"新章"）',
    '- dynastyYear: 年号（如"万历"、"民国"）；dynastyDate: 纪年日期（如"光绪二十四年十二月上"）',
    '- conferenceName/conferencePlace: 会议名称/地点',
    '- originalInfo: 转引文献中"原文献版本信息"（如"1925年10月"）；quoteAuthor/quoteTitle/quotePlace/quotePublisher/quoteYear/quotePages/quoteVolume: 转引自的另一文献各字段',
    '- extra: 需要原样保留的补充文字（如"引《魏台访议》"、"Ref. 号"等）',
    '- seePrefix: 间接引文引领词（"参见"或"详见"，没有则不填）',
    '',
    'type 判定规则：',
    '- book: 单行本著作（含主编、译著、经典全集）',
    '- chapter: 论文集中的一篇文章/析出文献（有"编/主编"和文集名，或某全集中的一篇）',
    '- preface: 书的序言/前言/后记（"序言"部分作为 partTitle 或省略）',
    '- journal: 期刊文章（containerTitle=期刊名，含卷/期/年）',
    '- newspaper: 报纸文章（containerTitle=报纸名，date=日期，edition=版次或栏目 column）',
    '- thesis: 学位论文（degree+institution）',
    '- conference: 会议论文（conferenceName）',
    '- archive: 档案/手稿（archiveNo/archivePlace 或"藏"字样）',
    '- diary: 日记（书名含"日记"且带年月日或整理者）',
    '- quoted: 转引文献（含"转引自"）',
    '- web: 电子文献（含 URL）',
    '- ancient: 古籍。ancientSubtype 判定：刻本（版本为某时某地某堂活字本/刻本）keben；点校本 dianjiao（有点校者）；影印本 yingyin（含"影印"或现代影印出版）；析出 chapter（古籍收入丛书，如《四库全书存目丛书》）；地方志 gazetteer（书名含"通志/县志/府志"，前面冠年号如"万历"）；常用基本典籍 classic（二十四史、《论语》等官修典籍或书名含作者名的文集，无作者）；编年体 biannian（含某年某月上/干支纪日，如"光绪二十四年十二月上"）。卷次放入 volume（只放数字如"3"），篇名放入 partTitle。',
    '',
    'lang 判定：中文文献 zh；英文 en；日文 ja；其他语种（法德俄等）other。',
    '',
    'missing：列出该条引注中通常必需但原文缺失的关键字段名（用上面字段名，如"publisher"、"pubYear"、"pages"）。若缺失出版年但原文明确写"出版时间不详"，则 pubYear 填"不详"、不列入 missing。',
    'uncertain：列出你无法确定含义或可能识别错误的字段名（如分不清卷次和页码时把两者都列入）。',
    '',
    '重要规则：',
    '1. 严禁编造原文没有的信息；找不到就省略或放入 missing。',
    '2. citations 必须且只能包含输入文本中真实存在的引注：输入中有几条就输出几条。严禁生成示例、演示数据或任何与输入无关的引注条目。',
    '3. 当输入只包含单独一条引注时，citations 数组长度必须为 1，且 type 必须与这条引注的实际类型一致，不得同时输出多个类型。',
    '4. 不要为了演示 JSON 结构而填充内容；没有的字段不要出现在 fields 里。',
    '5. 一条输入可能包含多条引注（换行、编号、分号等分隔），须逐条拆分；但不得把一条完整引注拆成多条。',
    '6. 若整个输入完全不像任何引注，citations 中只放你尽力提取的一条（不确定字段放入 uncertain），不得发散成多条。',
    '7. 只输出 JSON，不要任何解释文字。',
    '',
    '输入输出示例（单条输入 → 单条输出）：',
    '输入：赵景深. 文坛忆旧[M]. 上海: 北新书局, 1948: 43.',
    '输出：{"citations":[{"lang":"zh","type":"book","fields":{"authors":["赵景深"],"title":"文坛忆旧","pubPlace":"上海","publisher":"北新书局","pubYear":"1948","pages":"43"},"missing":[],"uncertain":[]}]}'
  ].join('\n');

  function buildMessages(input) {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: '请解析以下文本中的引注信息：\n\n' + input }
    ];
  }

  function extractJson(content) {
    if (!content) return null;
    var s = String(content).trim();
    var m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) s = m[1].trim();
    var start = s.indexOf('{');
    var end = s.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(s.slice(start, end + 1));
    } catch (e) {
      return null;
    }
  }

  function str(v) {
    if (v === undefined || v === null) return undefined;
    if (Array.isArray(v)) return v.map(function (x) { return String(x).trim(); }).filter(Boolean);
    return String(v).trim();
  }

  function cleanCitation(c) {
    if (!c || typeof c !== 'object') return null;
    var lang = str(c.lang);
    if (['zh', 'en', 'ja', 'other'].indexOf(lang) < 0) lang = 'zh';
    var type = str(c.type);
    var allowed = ['book', 'chapter', 'preface', 'journal', 'newspaper', 'thesis', 'conference', 'archive', 'diary', 'quoted', 'web', 'ancient'];
    if (allowed.indexOf(type) < 0) type = 'book';
    var fields = {};
    var raw = c.fields || {};
    FIELD_KEYS.forEach(function (k) {
      var v = str(raw[k]);
      if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) fields[k] = v;
    });
    var out = {
      lang: lang,
      type: type,
      fields: fields,
      missing: Array.isArray(c.missing) ? c.missing.map(str).filter(Boolean) : [],
      uncertain: Array.isArray(c.uncertain) ? c.uncertain.map(str).filter(Boolean) : [],
      duplicateOf: null
    };
    if (type === 'ancient') {
      var sub = str(c.ancientSubtype);
      var subs = ['keben', 'dianjiao', 'yingyin', 'chapter', 'gazetteer', 'classic', 'biannian'];
      out.ancientSubtype = subs.indexOf(sub) >= 0 ? sub : 'keben';
    }
    return out;
  }

  function normalize(result) {
    if (!result || !Array.isArray(result.citations)) return null;
    var list = result.citations.map(cleanCitation).filter(Boolean);
    if (!list.length) return null;
    return list;
  }

  // ---------- 正则兜底解析（API 不可用时的降级） ----------
  var RE_LSYJ_BOOK = /^(.+?)：《(.+?)》，(.+?)：(.+?)，(.+?)年(?:，第(.+?)页)?。/;
  var RE_GBT_BOOK = /^(.+?)\.\s+(.+?)(?:\[(.+?)\])?\.\s+(.+?):\s+(.+?),\s+(\d{4})(?::\s+(.+?))?\./;
  var RE_GBT_JOURNAL = /^(.+?)\.\s+(.+?)\[(.+?)\]\s*\/?\/?\s*\.?\s*(.+?),\s*(\d{4})\((\d+)\):\s*(.+?)\./;
  var RE_APA_BOOK = /^(.+?)\s+\((\d{4})\)\.\s+(.+?)\.\s+(.+?)\.$/;
  var RE_APA_JOURNAL = /^(.+?)\s+\((\d{4})\)\.\s+(.+?)\.\s+(.+?),\s*(\d+)\((\d+)\)\s*,?\s*(.+?)\.$/;
  var RE_MLA_BOOK = /^(.+?)\.\s+(.+?)\.\s+(.+?),\s+(\d{4})\.$/;
  var RE_MLA_JOURNAL = /^(.+?)\.\s+[""](.+?)[""]\s*\.?\s*(.+?),\s*vol\.\s*(\d+),\s*no\.\s*(\d+),\s*(\d{4}),\s*pp\.\s*(.+?)\.$/;

  function splitLines(input) {
    return String(input || '')
      .split(/\r?\n/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 3; });
  }

  function fallbackParse(input) {
    var citations = [];
    splitLines(input).forEach(function (line) {
      var c = null;
      var m;
      if ((m = line.match(RE_LSYJ_BOOK))) {
        c = citeM('zh', 'book', { authors: [m[1]], title: m[2], pubPlace: m[3], publisher: m[4], pubYear: m[5], pages: m[6] });
      } else if ((m = line.match(RE_GBT_BOOK))) {
        c = citeM('zh', 'book', { authors: [m[1]], title: m[2], pubPlace: m[4], publisher: m[5], pubYear: m[6], pages: m[7] });
      } else if ((m = line.match(RE_GBT_JOURNAL))) {
        c = citeM('zh', 'journal', { authors: [m[1]], title: m[2], containerTitle: m[4], pubYear: m[5], issue: m[6], pages: m[7] });
      } else if ((m = line.match(RE_APA_BOOK))) {
        c = citeM('en', 'book', { authors: [m[1]], pubYear: m[2], title: m[3], publisher: m[4] });
      } else if ((m = line.match(RE_APA_JOURNAL))) {
        c = citeM('en', 'journal', { authors: [m[1]], pubYear: m[2], title: m[3], containerTitle: m[4], volume: m[5], issue: m[6], pages: m[7] });
      } else if ((m = line.match(RE_MLA_JOURNAL))) {
        c = citeM('en', 'journal', { authors: [m[1]], title: m[2], containerTitle: m[3], volume: m[4], issue: m[5], pubYear: m[6], pages: m[7] });
      } else if ((m = line.match(RE_MLA_BOOK))) {
        c = citeM('en', 'book', { authors: [m[1]], title: m[2], publisher: m[3], pubYear: m[4] });
      }
      if (c) citations.push(c);
    });
    return citations.length ? citations : null;
  }

  function citeM(lang, type, fields) {
    var clean = {};
    Object.keys(fields || {}).forEach(function (k) {
      if (fields[k] !== undefined && fields[k] !== null && fields[k] !== '') clean[k] = String(fields[k]);
    });
    return { lang: lang, type: type, fields: clean, missing: [], uncertain: [], duplicateOf: null };
  }

  // ---------- 防幻觉过滤：AI 返回条目必须能在输入文本中找到依据 ----------
  function normalizeText(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\s\u3000]+/g, '')
      .replace(/[《》〈〉「」『』“”"'（）()\[\]【】.,，。;；:：\-–—·、/\\|@#$%^&*+=_~?？！]/g, '');
  }

  function anchorFound(anchor, input) {
    if (!anchor) return false;
    var a = normalizeText(anchor);
    if (!a || a.length < 2) return false;
    var inp = normalizeText(input);
    if (inp.indexOf(a) >= 0) return true;
    var cjk = a.match(/[\u4e00-\u9fff\u3040-\u30ff]/g);
    if (cjk && cjk.length >= 4) {
      var hit = 0;
      cjk.forEach(function (ch) { if (inp.indexOf(ch) >= 0) hit++; });
      return hit / cjk.length >= 0.5;
    }
    return false;
  }

  function filterUnrelated(citations, input) {
    var kept = [];
    var removed = 0;
    (citations || []).forEach(function (c) {
      var f = c.fields || {};
      var anchors = [f.title, f.containerTitle, f.quoteTitle];
      if (Array.isArray(f.authors)) anchors = anchors.concat(f.authors);
      var ok = false;
      for (var i = 0; i < anchors.length; i++) {
        if (anchorFound(anchors[i], input)) { ok = true; break; }
      }
      if (ok) kept.push(c);
      else removed++;
    });
    return { citations: kept, removed: removed };
  }

  return {
    buildMessages: buildMessages,
    extractJson: extractJson,
    normalize: normalize,
    fallbackParse: fallbackParse,
    filterUnrelated: filterUnrelated,
    normalizeText: normalizeText,
    SYSTEM_PROMPT: SYSTEM_PROMPT
  };
});
