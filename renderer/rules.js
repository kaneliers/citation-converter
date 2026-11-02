(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Rules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FORMATS = ['lsyj', 'gbt', 'apa', 'mla'];
  var FORMAT_LABELS = {
    lsyj: '《历史研究》', gbt: 'GB/T 7714', apa: 'APA 7th', mla: 'MLA 9th'
  };

  var TYPE_LABELS = {
    book: '著作', chapter: '析出文献', preface: '序言', journal: '期刊',
    newspaper: '报纸', thesis: '学位论文', conference: '会议论文',
    archive: '档案文献', diary: '日记', quoted: '转引文献', web: '电子文献',
    ancient: '古籍'
  };
  var ANCIENT_LABELS = {
    keben: '古籍·刻本', dianjiao: '古籍·点校本', yingyin: '古籍·影印本',
    chapter: '古籍·析出', gazetteer: '古籍·地方志', classic: '常用典籍',
    biannian: '编年体典籍'
  };

  var LBL_ZH = {
    authors: '责任者', title: '文献题名', containerTitle: '文集/刊名',
    partTitle: '篇名', publisher: '出版者', pubPlace: '出版地点',
    pubYear: '出版时间', pages: '页码', translator: '译者', editor: '编者',
    collator: '点校者', organizer: '整理者', volume: '卷次', issue: '期号',
    version: '版本', edition: '版次', institution: '学校/单位',
    degree: '学位', date: '日期', archiveNo: '卷宗号/档号',
    archivePlace: '藏所', url: '网址', accessDate: '访问时间',
    seriesName: '丛书名', seriesVolume: '册数', department: '部类',
    column: '栏目', physicalPart: '册别', dynastyYear: '年号',
    dynastyDate: '纪年日期', conferenceName: '会议名称',
    conferencePlace: '会议地点', originalInfo: '原文献版本信息',
    quoteAuthor: '转引责任者', quoteTitle: '转引文献题名',
    quotePlace: '转引出版地', quotePublisher: '转引出版者',
    quoteYear: '转引出版年', quotePages: '转引页码', quoteVolume: '转引卷册',
    extra: '补充说明', volumeUnit: '卷册单位', issueUnit: '期号单位'
  };
  var LBL_EN = {
    authors: 'author', title: 'title', containerTitle: 'container',
    partTitle: 'part title', publisher: 'publisher', pubPlace: 'place',
    pubYear: 'year', pages: 'page(s)', translator: 'translator',
    editor: 'editor', collator: 'collator', organizer: 'organizer',
    volume: 'volume', issue: 'issue', version: 'version', edition: 'edition',
    institution: 'institution', degree: 'degree', date: 'date',
    archiveNo: 'archive no.', archivePlace: 'repository', url: 'URL',
    accessDate: 'access date', seriesName: 'series', seriesVolume: 'series vol.',
    department: 'category', column: 'column', physicalPart: 'part',
    dynastyYear: 'reign', dynastyDate: 'reign date',
    conferenceName: 'conference', conferencePlace: 'conference place',
    originalInfo: 'original info', quoteAuthor: 'quoted author',
    quoteTitle: 'quoted title', quotePlace: 'quoted place',
    quotePublisher: 'quoted publisher', quoteYear: 'quoted year',
    quotePages: 'quoted page', quoteVolume: 'quoted vol.',
    extra: 'extra', volumeUnit: 'volume unit', issueUnit: 'issue unit'
  };

  function has(f, k) {
    var v = f && f[k];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }
  function val(f, k) { return has(f, k) ? String(f[k]).trim() : ''; }
  function labelFor(k, lang) {
    var t = lang === 'en' ? LBL_EN : LBL_ZH;
    return t[k] || k;
  }

  function Seg(v, m, u, i) { return { v: v, m: !!m, u: !!u, i: !!i }; }

  function Builder(c) {
    this.f = c.fields || {};
    this.missing = c.missing || [];
    this.uncertain = c.uncertain || [];
    this.segs = [];
    this.lang = (['zh', 'ja'].indexOf(c.lang) >= 0) ? c.lang : 'en';
    this.c = c;
  }
  Builder.prototype.isMiss = function (k) { return this.missing.indexOf(k) >= 0; };
  Builder.prototype.isUnc = function (k) { return this.uncertain.indexOf(k) >= 0; };
  Builder.prototype.raw = function (s, i) { if (s) this.segs.push(Seg(s, false, false, i)); return this; };
  Builder.prototype.field = function (k, opts) {
    opts = opts || {};
    if (has(this.f, k)) {
      var v = val(this.f, k);
      if (opts.prefix) v = opts.prefix + v;
      if (opts.suffix) v = v + opts.suffix;
      this.segs.push(Seg(v, false, this.isUnc(k), opts.i));
    } else if (opts.required) {
      this.segs.push(Seg('【缺：' + labelFor(k, this.lang) + '】', true, false, opts.i));
    }
    return this;
  };
  Builder.prototype.text = function () {
    return this.segs.map(function (s) { return s.v; }).join('');
  };
  Builder.prototype.done = function (notes) {
    return { segments: this.segs, text: this.text(), notes: notes || [] };
  };
  // 末尾字段：值为页/章时按中文页码习惯渲染
  Builder.prototype.zhPage = function (k, required) {
    var v = val(this.f, k);
    if (v) this.segs.push(Seg(zhPages(v), false, this.isUnc(k), false));
    else if (required) this.segs.push(Seg('【缺：' + labelFor(k, this.lang) + '】', true, false, false));
    return this;
  };
  Builder.prototype.enPage = function (k, required) {
    var v = val(this.f, k);
    if (v) this.segs.push(Seg(enPages(v), false, this.isUnc(k), false));
    else if (required) this.segs.push(Seg('【缺：' + labelFor(k, this.lang) + '】', true, false, false));
    return this;
  };

  // ---------- 通用辅助 ----------
  function joinAuthors(list) { return (list || []).join('、'); }
  function zhPages(p) {
    if (!p) return '';
    p = String(p).trim();
    if (p[0] === '第' || p.indexOf('页') >= 0 || p.indexOf('頁') >= 0) return p;
    if (/^\d+[ab]$/.test(p)) return '第' + p.slice(0, -1) + '页' + p.slice(-1);
    if (/^\d/.test(p)) {
      if (/^[\d\s\-–—－,，、和&]+$/.test(p)) return '第' + p + '页';
      return '第' + p;
    }
    if (/^[一二三四五六七八九十百千零]+$/.test(p)) return '第' + p + '页';
    return '第' + p;
  }
  function zhYear(y) {
    if (!y) return '';
    y = String(y).trim();
    if (y.indexOf('不详') >= 0) return '出版时间不详';
    if (y.indexOf('年') >= 0) return y;
    return y + '年';
  }
  function zhUnit(v, unit) {
    v = String(v || '').trim();
    if (!v) return '';
    return v[0] === '第' ? v : '第' + v + (unit || '');
  }
  function enPages(p) {
    if (!p) return '';
    p = String(p).trim();
    if (/^p/i.test(p)) return p;
    var isRange = /[-–—,]/.test(p);
    return (isRange ? 'pp.' : 'p.') + p;
  }
  function jaPages(p) {
    if (!p) return '';
    p = String(p).trim();
    if (p[0] === '第') return p;
    if (p.indexOf('頁') >= 0) return '第' + p;
    return '第' + p + '頁';
  }
  function isoDate(d) {
    if (!d) return '';
    d = String(d).trim();
    var m = d.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (m) return m[1] + '-' + (m[2].length === 1 ? '0' : '') + m[2] + '-' + (m[3].length === 1 ? '0' : '') + m[3];
    return d;
  }

  function enAuthors(list, role) {
    var a = (list || []).slice();
    var s;
    if (a.length === 0) s = '';
    else if (a.length === 1) s = a[0];
    else if (a.length === 2) s = a[0] + ' and ' + a[1];
    else if (a.length === 3) s = a[0] + ', ' + a[1] + ' and ' + a[2];
    else s = a[0] + ' et al.';
    if (role === 'ed') s = s + ', ed.';
    else if (role === 'eds') s = s + ', eds.';
    return s;
  }

  function lastNameFirst(name) {
    name = String(name || '').trim();
    if (name.indexOf(',') >= 0) return name;
    var parts = name.split(/\s+/);
    if (parts.length === 1) return name;
    var last = parts.pop();
    var initials = parts.map(function (w) {
      w = w.replace(/[^A-Za-z.\u4e00-\u9fa5]/g, '');
      if (!w) return '';
      return w[0].toUpperCase() + '.';
    }).filter(Boolean);
    return last + ', ' + initials.join(' ');
  }
  function apaAuthors(list) {
    var a = (list || []).slice();
    if (!a.length) return '';
    if (a.length > 3) return lastNameFirst(a[0]) + ', et al.';
    return a.map(lastNameFirst).join(', ');
  }
  function mlaAuthors(list) {
    var a = (list || []).slice();
    if (!a.length) return '';
    function lf(n) {
      n = String(n).trim();
      if (n.indexOf(',') >= 0) return n;
      var p = n.split(/\s+/);
      var last = p.pop();
      return p.length ? last + ', ' + p.join(' ') : last;
    }
    if (a.length === 1) return lf(a[0]);
    if (a.length === 2) return lf(a[0]) + ', and ' + a[1];
    return lf(a[0]) + ', et al.';
  }

  function sentenceCase(s) {
    var ws = String(s || '').split(/\s+/);
    var out = [];
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!w) continue;
      var prev = i > 0 ? ws[i - 1] : '';
      var afterColon = /[:?.!—–]$/.test(prev);
      var first = w[0];
      var rest = w.slice(1);
      if (/^[A-Z]/.test(first) && rest === rest.toLowerCase() && rest !== '') {
        if (i === 0 || afterColon) out.push(w);
        else out.push(w.toLowerCase());
      } else out.push(w);
    }
    return out.join(' ');
  }

  function normalizeRange(s) { return String(s || '').replace(/[-−]/g, '–'); }

  // ============================================================
  // 《历史研究》 lsyj
  // ============================================================
  function lsyjZh(b, c, opts) {
    var f = b.f, type = c.type, simple = opts.simple;
    var role = val(f, 'authorRole') || '著';
    function placePub() {
      b.field('pubPlace', { required: true });
      b.raw('：');
      b.field('publisher', { required: true });
    }
    function year() {
      if (has(f, 'pubYear')) b.raw(zhYear(f.pubYear));
      else b.field('pubYear', { required: true });
    }
    function pubTail() {
      b.raw('，'); placePub(); b.raw('，'); year(); b.raw('，');
      b.zhPage('pages', true); b.raw('。');
    }
    function simpleTail() {
      b.raw('，'); b.zhPage('pages', true); b.raw('。');
    }

    switch (type) {
      case 'book': {
        if (has(f, 'authors')) {
          b.raw(joinAuthors(f.authors));
          if (role && role !== '著') b.raw(role);
          b.raw('：');
        }
        b.raw('《'); b.field('title', { required: true }); b.raw('》');
        if (has(f, 'volume')) { b.raw(zhUnit(f.volume, val(f, 'volumeUnit') || '卷')); }
        if (has(f, 'translator')) { b.raw('，'); b.field('translator'); b.raw('译'); }
        else if (has(f, 'collator')) { b.raw('，'); b.field('collator'); b.raw('点校'); }
        if (simple) simpleTail();
        else pubTail();
        break;
      }
      case 'chapter': {
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》，');
        if (has(f, 'editor')) { b.field('editor'); b.raw(val(f, 'editorRole') || '编'); b.raw('：'); }
        b.raw('《'); b.field('containerTitle', { required: true }); b.raw('》');
        if (has(f, 'edition')) { b.raw('（'); b.field('edition'); b.raw('）'); }
        if (has(f, 'volume')) { b.raw(zhUnit(f.volume, val(f, 'volumeUnit') || '册')); }
        if (simple) simpleTail();
        else pubTail();
        break;
      }
      case 'preface': {
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》');
        b.raw('，');
        if (simple) {
          b.raw('，');
        } else {
          placePub(); b.raw('，'); year(); b.raw('，');
        }
        if (has(f, 'partTitle')) { b.raw('“'); b.field('partTitle'); b.raw('”'); }
        else b.raw('“序言”');
        b.raw('，');
        b.zhPage('pages', true); b.raw('。');
        break;
      }
      case 'ancient': {
        var sub = c.ancientSubtype || 'keben';
        if (sub === 'gazetteer') {
          if (has(f, 'dynastyYear')) b.field('dynastyYear');
          b.raw('《'); b.field('title', { required: true }); b.raw('》');
        } else if (has(f, 'authors')) {
          b.raw(joinAuthors(f.authors)); b.raw('：'); b.raw('《');
          b.field('title', { required: true }); b.raw('》');
        } else {
          b.raw('《'); b.field('title', { required: true }); b.raw('》');
        }
        if (has(f, 'volume')) { b.raw('卷'); b.raw(val(f, 'volume')); }
        else if (sub === 'classic' || sub === 'biannian' || has(f, 'partTitle')) b.field('volume', { required: true });
        if (has(f, 'partTitle')) { b.raw('《'); b.field('partTitle'); b.raw('》'); }
        if (has(f, 'extra')) b.field('extra');
        if (sub === 'biannian' && has(f, 'dynastyDate')) { b.raw('，'); b.field('dynastyDate'); }
        if (simple) { simpleTail(); break; }
        if (sub === 'keben') {
          b.raw('，'); b.field('version', { required: true }); b.raw('，');
          b.zhPage('pages', true); b.raw('。');
        } else if (sub === 'dianjiao') {
          if (has(f, 'collator')) { b.raw('，'); b.field('collator'); b.raw('点校'); }
          b.raw('，'); placePub(); b.raw('，'); year(); b.raw('，');
          b.zhPage('pages', true); b.raw('。');
        } else {
          if ((sub === 'chapter' || sub === 'gazetteer') && has(f, 'seriesName')) {
            b.raw('，');
            if (has(f, 'editor')) { b.field('editor'); b.raw(val(f, 'editorRole') || '辑'); b.raw('：'); }
            b.raw('《'); b.field('seriesName'); b.raw('》');
          }
          var seriesAfterTitle = has(f, 'seriesYear') && has(f, 'pubYear') && val(f, 'seriesYear') !== val(f, 'pubYear');
          if (seriesAfterTitle && has(f, 'seriesVolume')) { b.raw('，'); b.raw(zhUnit(f.seriesVolume, '')); b.raw('册'); }
          b.raw('，'); placePub(); b.raw('，');
          if (has(f, 'pubYear')) {
            b.raw(String(f.pubYear).replace(/年.*$/, '') + '年');
            if (has(f, 'version')) b.raw(val(f, 'version'));
            else if (sub === 'yingyin' || sub === 'gazetteer' || sub === 'biannian') b.raw('影印本');
          } else b.field('pubYear', { required: true });
          if (has(f, 'department')) { b.raw('，'); b.field('department'); }
          if (!seriesAfterTitle && has(f, 'seriesVolume')) { b.raw('，'); b.raw(zhUnit(f.seriesVolume, '')); b.raw('册'); }
          if (has(f, 'physicalPart')) { b.raw('，'); b.field('physicalPart'); }
          b.raw('，');
          var pg = val(f, 'pages');
          var segTxt = zhPages(pg) || '【缺：页码】';
          if (pg && has(f, 'column')) segTxt = zhPages(pg) + val(f, 'column');
          b.segs.push(Seg(segTxt, !has(f, 'pages'), b.isUnc('pages'), false));
          b.raw('。');
        }
        break;
      }
      case 'journal': {
        if (simple) {
          if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》，');
          b.zhPage('pages', true); b.raw('。');
          break;
        }
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》，');
        b.raw('《'); b.field('containerTitle', { required: true }); b.raw('》');
        if (has(f, 'pubPlace')) { b.raw('（'); b.field('pubPlace'); b.raw('）'); }
        if (has(f, 'volume')) {
          b.raw(zhUnit(f.volume, '')); b.raw('卷');
          if (has(f, 'issue')) { b.raw(zhUnit(f.issue, '')); b.raw(val(f, 'issueUnit') || '期'); }
          b.raw('，'); year();
        } else {
          year();
          if (has(f, 'issue')) { b.raw(zhUnit(f.issue, '')); b.raw(val(f, 'issueUnit') || '期'); }
        }
        if (!opts.omitPages) { b.raw('，'); b.zhPage('pages', true); }
        b.raw('。');
        break;
      }
      case 'newspaper': {
        if (simple) {
          if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》，');
          if (has(f, 'edition')) {
            var se = val(f, 'edition');
            b.raw(se.indexOf('版') >= 0 ? se : '第' + se + '版');
          } else b.zhPage('pages', false);
          b.raw('。');
          break;
        }
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》，');
        b.raw('《'); b.field('containerTitle', { required: true }); b.raw('》');
        if (has(f, 'pubPlace')) { b.raw('（'); b.field('pubPlace'); b.raw('）'); }
        if (has(f, 'volume')) { b.raw(zhUnit(f.volume, '')); b.raw('，'); }
        b.field('date', { required: true });
        if (has(f, 'edition')) {
          b.raw('，');
          var e = val(f, 'edition');
          b.raw(e.indexOf('版') >= 0 ? e : '第' + e + '版');
        } else if (has(f, 'column')) {
          b.raw('，“'); b.field('column'); b.raw('”');
        }
        if (has(f, 'pages')) { b.raw('，'); b.zhPage('pages', false); }
        b.raw('。');
        break;
      }
      case 'thesis': {
        if (simple) {
          if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》，');
          b.zhPage('pages', false); b.raw('。');
          break;
        }
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》，');
        b.field('degree', { required: true }); b.raw('学位论文，');
        b.field('institution', { required: true }); b.raw('，');
        year(); b.raw('，');
        b.zhPage('pages', true); b.raw('。');
        break;
      }
      case 'conference': {
        if (simple) {
          if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》，');
          b.zhPage('pages', false); b.raw('。');
          break;
        }
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》，');
        b.field('conferenceName', { required: true }); b.raw('论文，');
        b.field('conferencePlace', { required: true }); b.raw('，');
        if (has(f, 'date')) b.field('date');
        else if (has(f, 'pubYear')) b.raw(zhYear(f.pubYear));
        else b.field('pubYear', { required: true });
        b.raw('，');
        b.zhPage('pages', true); b.raw('。');
        break;
      }
      case 'archive': {
        if (simple) {
          if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》。');
          break;
        }
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》，');
        b.field('date', { required: true }); b.raw('，');
        b.field('archiveNo', { required: true }); b.raw('，');
        b.field('archivePlace', { required: true });
        if (has(f, 'archivePlace')) b.raw('藏');
        b.raw('。');
        break;
      }
      case 'diary': {
        if (simple) {
          if (has(f, 'editor')) { b.field('editor'); b.raw(val(f, 'editorRole') || '编'); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》');
          if (has(f, 'volume')) b.raw(zhUnit(f.volume, '册'));
          b.raw('，');
          b.zhPage('pages', false); b.raw('。');
          break;
        }
        if (has(f, 'editor')) { b.field('editor'); b.raw(val(f, 'editorRole') || '编'); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》');
        if (has(f, 'volume')) b.raw(zhUnit(f.volume, '册'));
        if (has(f, 'date')) { b.raw('，'); b.field('date'); }
        if (has(f, 'organizer')) { b.raw('，'); b.field('organizer'); b.raw('整理'); }
        b.raw('，'); placePub(); b.raw('，'); year(); b.raw('，');
        b.zhPage('pages', true); b.raw('。');
        break;
      }
      case 'quoted': {
        if (simple) {
          if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》，转引自');
          if (has(f, 'quoteAuthor')) { b.field('quoteAuthor'); b.raw('：'); }
          b.raw('《'); b.field('quoteTitle', { required: true }); b.raw('》，');
          b.zhPage('quotePages', true); b.raw('。');
          break;
        }
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》，');
        if (has(f, 'originalInfo')) { b.field('originalInfo'); b.raw('，'); }
        b.raw('转引自');
        if (has(f, 'quoteAuthor')) { b.field('quoteAuthor'); b.raw('：'); }
        b.raw('《'); b.field('quoteTitle', { required: true }); b.raw('》');
        if (has(f, 'quoteVolume')) b.field('quoteVolume');
        b.raw('，');
        if (has(f, 'quotePlace')) { b.field('quotePlace'); b.raw('：'); }
        b.field('quotePublisher', { required: true }); b.raw('，');
        if (has(f, 'quoteYear')) b.raw(zhYear(f.quoteYear)); else b.field('quoteYear', { required: true });
        b.raw('，');
        b.zhPage('quotePages', true); b.raw('。');
        break;
      }
      case 'web': {
        if (simple) {
          if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
          b.raw('《'); b.field('title', { required: true }); b.raw('》。');
          break;
        }
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('《'); b.field('title', { required: true }); b.raw('》');
        if (has(f, 'containerTitle')) {
          b.raw('，《'); b.field('containerTitle'); b.raw('》');
          if (has(f, 'pubPlace')) { b.raw('（'); b.field('pubPlace'); b.raw('）'); }
          if (has(f, 'pubYear')) b.raw(zhYear(f.pubYear));
          if (has(f, 'issue')) { b.raw(zhUnit(f.issue, '')); b.raw('期'); }
        }
        b.raw('，');
        b.field('url', { required: true });
        b.raw(', 访问时间：');
        b.field('accessDate', { required: true });
        b.raw('。');
        break;
      }
      default: break;
    }
    return b.done();
  }

  function lsyjEn(b, c, opts) {
    var f = b.f, simple = opts.simple;
    var type = c.type;
    function pub() {
      b.field('pubPlace', { required: true });
      b.raw(': ');
      b.field('publisher', { required: true });
    }
    function year() {
      if (has(f, 'pubYear')) b.raw(String(f.pubYear));
      else b.field('pubYear', { required: true });
    }
    switch (type) {
      case 'book': {
        var au = enAuthors(f.authors, val(f, 'authorRole'));
        if (au) { b.raw(au); b.raw(', '); }
        b.field('title', { required: true, i: true });
        if (has(f, 'translator')) { b.raw(', trans. '); b.field('translator'); }
        if (has(f, 'edition')) { b.raw(', '); b.field('edition'); }
        if (simple) {
          b.raw(', '); b.enPage('pages', true); b.raw('.');
        } else {
          b.raw(', '); pub(); b.raw(', '); year();
          if (!opts.omitPages) { b.raw(', '); b.enPage('pages', true); }
          b.raw('.');
        }
        break;
      }
      case 'chapter': {
        var a2 = enAuthors(f.authors, val(f, 'authorRole'));
        if (a2) { b.raw(a2); b.raw(', '); }
        b.raw('“'); b.field('title', { required: true }); b.raw(',” in ');
        if (has(f, 'editor')) {
          var er = val(f, 'editorRole') || 'eds.';
          if (er === 'ed') er = 'ed.';
          else if (er === 'eds') er = 'eds.';
          b.field('editor'); b.raw(', ' + er + ', ');
        }
        b.field('containerTitle', { required: true, i: true });
        if (simple) {
          b.raw(', '); b.enPage('pages', true); b.raw('.');
        } else {
          b.raw(', '); pub(); b.raw(', '); year();
          if (!opts.omitPages) { b.raw(', '); b.enPage('pages', true); }
          b.raw('.');
        }
        break;
      }
      case 'journal': {
        var a3 = enAuthors(f.authors, val(f, 'authorRole'));
        if (a3) { b.raw(a3); b.raw(', '); }
        b.raw('“'); b.field('title', { required: true }); b.raw(',” ');
        if (simple) {
          b.enPage('pages', true); b.raw('.');
          break;
        }
        b.field('containerTitle', { required: true, i: true });
        if (has(f, 'volume')) { b.raw(', Vol. '); b.field('volume'); }
        if (has(f, 'issue')) { b.raw(', No. '); b.field('issue'); }
        b.raw(', '); year();
        if (!opts.omitPages) { b.raw(', '); b.enPage('pages', true); }
        b.raw('.');
        break;
      }
      case 'thesis': {
        var a4 = enAuthors(f.authors, val(f, 'authorRole'));
        if (a4) { b.raw(a4); b.raw(', '); }
        b.raw('“'); b.field('title', { required: true }); b.raw(',” ');
        if (simple) { b.enPage('pages', false); b.raw('.'); break; }
        b.raw('Ph.D. dissertation, ');
        b.field('institution', { required: true });
        b.raw(', '); year(); b.raw('.');
        break;
      }
      case 'archive': {
        if (simple) {
          b.field('title', { required: true });
          if (has(f, 'date')) { b.raw(', '); b.field('date'); }
          b.raw('.');
          break;
        }
        b.field('title', { required: true });
        b.raw(', ');
        b.field('date', { required: true });
        b.raw(', ');
        b.field('archiveNo', { required: true });
        b.raw(', ');
        b.field('archivePlace', { required: true });
        b.raw('.');
        break;
      }
      case 'web': {
        var a6 = enAuthors(f.authors, val(f, 'authorRole'));
        if (a6) { b.raw(a6); b.raw(', '); }
        b.raw('“'); b.field('title', { required: true }); b.raw(',” ');
        if (simple) { b.raw('.'); break; }
        b.field('url', { required: true });
        b.raw(', accessed ');
        b.field('accessDate', { required: true });
        b.raw('.');
        break;
      }
      default:
        return lsyjZh(b, c, opts);
    }
    return b.done();
  }

  function lsyjJa(b, c, opts) {
    var f = b.f;
    var type = c.type;
    var simple = opts.simple;
    function jaYear() {
      if (has(f, 'pubYear')) b.raw(zhYear(f.pubYear));
      else b.field('pubYear', { required: true });
    }
    function jaPage(required) {
      var v = val(f, 'pages');
      b.segs.push(Seg(jaPages(v) || '【缺：页码】', !has(f, 'pages') && required, b.isUnc('pages'), false));
    }
    switch (type) {
      case 'book': {
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('『'); b.field('title', { required: true }); b.raw('』');
        if (simple) { b.raw('、'); jaPage(true); b.raw('。'); break; }
        b.raw('、');
        b.field('pubPlace', { required: true }); b.raw('：');
        b.field('publisher', { required: true }); b.raw('、');
        jaYear(); b.raw('、');
        jaPage(true);
        b.raw('。');
        break;
      }
      case 'chapter': {
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('「'); b.field('title', { required: true }); b.raw('」');
        if (simple) { b.raw('、'); jaPage(true); b.raw('。'); break; }
        b.raw('、');
        if (has(f, 'editor')) { b.field('editor'); b.raw(val(f, 'editorRole') || '編'); b.raw('：'); }
        b.raw('『'); b.field('containerTitle', { required: true }); b.raw('』');
        if (has(f, 'volume')) b.raw(zhUnit(f.volume, '巻'));
        b.raw('、');
        b.field('pubPlace', { required: true }); b.raw('：');
        b.field('publisher', { required: true }); b.raw('、');
        jaYear(); b.raw('、');
        jaPage(true);
        b.raw('。');
        break;
      }
      case 'journal': {
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('「'); b.field('title', { required: true }); b.raw('」');
        if (simple) { b.raw('、'); jaPage(true); b.raw('。'); break; }
        b.raw('、');
        b.raw('『'); b.field('containerTitle', { required: true }); b.raw('』');
        if (has(f, 'volume')) b.raw(zhUnit(f.volume, '巻'));
        if (has(f, 'issue')) b.raw(zhUnit(f.issue, '号'));
        b.raw('、');
        jaYear(); b.raw('、');
        jaPage(true);
        b.raw('。');
        break;
      }
      case 'archive': {
        if (simple) {
          b.raw('「'); b.field('title', { required: true }); b.raw('」');
          if (has(f, 'date')) { b.raw('（'); b.field('date'); b.raw('）'); }
          b.raw('。');
          break;
        }
        b.raw('「'); b.field('title', { required: true }); b.raw('」（');
        b.field('date', { required: true }); b.raw('）、『');
        b.field('archiveNo', { required: true }); b.raw('』');
        if (has(f, 'volume')) b.raw(zhUnit(f.volume, '巻'));
        b.raw('、');
        jaPage(true);
        b.raw('、');
        b.field('archivePlace', { required: true });
        b.raw('、Ref. ');
        b.field('extra', { required: true });
        b.raw('。');
        break;
      }
      case 'web': {
        if (has(f, 'authors')) { b.raw(joinAuthors(f.authors)); b.raw('：'); }
        b.raw('「'); b.field('title', { required: true }); b.raw('」');
        if (simple) { b.raw('。'); break; }
        b.raw('、');
        b.field('url', { required: true }); b.raw('、访问时间：');
        b.field('accessDate', { required: true });
        b.raw('。');
        break;
      }
      default:
        return lsyjZh(b, c, opts);
    }
    return b.done();
  }

  function isOther(lang) { return ['zh', 'en', 'ja'].indexOf(lang) < 0; }

  function renderLsyj(citation, opts) {
    opts = opts || {};
    var b = new Builder(citation);
    var notes = [];
    var lang = citation.lang || 'zh';
    if (isOther(lang)) {
      notes.push('该语种《历史研究》无专条规定，已按英文文献规则转换，请人工核对。');
      lang = 'en';
    }
    var out;
    if (lang === 'en') out = lsyjEn(b, citation, opts);
    else if (lang === 'ja') out = lsyjJa(b, citation, opts);
    else out = lsyjZh(b, citation, opts);
    out.notes = out.notes.concat(notes);
    return out;
  }

  // ============================================================
  // GB/T 7714-2015
  // ============================================================
  function gbtZh(b, c) {
    var f = b.f, type = c.type;
    var role = val(f, 'authorRole');
    function authorPart() {
      if (has(f, 'authors')) {
        b.raw(joinAuthors(f.authors));
        if (role && role !== '著') b.raw(', ' + role);
        b.raw('. ');
      }
    }
    function pubPart() {
      b.field('pubPlace', { required: true }); b.raw(': ');
      b.field('publisher', { required: true }); b.raw(', ');
      if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
      if (has(f, 'pages')) { b.raw(': '); b.field('pages'); }
      b.raw('.');
    }
    switch (type) {
      case 'book': {
        authorPart();
        b.field('title', { required: true });
        if (has(f, 'edition')) { b.raw('[' + val(f, 'edition') + '版]'); }
        b.raw('[M]. ');
        if (has(f, 'translator')) { b.field('translator'); b.raw(', 译. '); }
        if (has(f, 'volume')) { b.raw(zhUnit(f.volume, val(f, 'volumeUnit') || '卷') + '. '); }
        pubPart();
        break;
      }
      case 'chapter': {
        authorPart();
        b.field('title', { required: true }); b.raw('[M]//');
        if (has(f, 'editor')) { b.field('editor'); b.raw(', ' + (val(f, 'editorRole') || '编') + '. '); }
        b.field('containerTitle', { required: true });
        if (has(f, 'volume')) { b.raw(': ' + zhUnit(f.volume, val(f, 'volumeUnit') || '册')); }
        b.raw('. ');
        b.field('pubPlace', { required: true }); b.raw(': ');
        b.field('publisher', { required: true }); b.raw(', ');
        if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
        if (has(f, 'pages')) { b.raw(': '); b.field('pages'); }
        b.raw('.');
        break;
      }
      case 'preface': {
        authorPart();
        b.field('title', { required: true }); b.raw('[M]. ');
        b.field('pubPlace', { required: true }); b.raw(': ');
        b.field('publisher', { required: true }); b.raw(', ');
        if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
        if (has(f, 'pages')) { b.raw(': '); b.field('pages'); }
        b.raw('.');
        break;
      }
      case 'ancient': {
        var sub = c.ancientSubtype || 'keben';
        authorPart();
        b.field('title', { required: true });
        if (has(f, 'volume')) { b.raw(': 卷' + val(f, 'volume')); }
        b.raw('[M]. ');
        var ver = '';
        if (has(f, 'version')) ver = val(f, 'version');
        else if (has(f, 'collator')) ver = val(f, 'collator') + ', 点校';
        else if (sub === 'yingyin') ver = '影印本';
        else if (sub === 'dianjiao') ver = '标点本';
        if (ver) b.raw(ver + '. ');
        if (sub === 'keben' && !has(f, 'pubPlace') && !has(f, 'publisher')) {
          if (has(f, 'pages')) { b.raw(': '); b.field('pages'); b.raw('.'); }
          else b.field('pages', { required: true });
        } else pubPart();
        break;
      }
      case 'journal': {
        authorPart();
        b.field('title', { required: true }); b.raw('[J]. ');
        b.field('containerTitle', { required: true }); b.raw(', ');
        if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
        if (has(f, 'volume') && has(f, 'issue')) { b.raw(', ' + val(f, 'volume') + '(' + val(f, 'issue') + ')'); }
        else if (has(f, 'issue')) { b.raw('(' + val(f, 'issue') + ')'); }
        if (has(f, 'pages')) { b.raw(': '); b.field('pages'); }
        else b.field('pages', { required: true });
        b.raw('.');
        break;
      }
      case 'newspaper': {
        authorPart();
        b.field('title', { required: true }); b.raw('[N]. ');
        b.field('containerTitle', { required: true }); b.raw(', ');
        if (has(f, 'date')) b.raw(isoDate(val(f, 'date'))); else b.field('date', { required: true });
        if (has(f, 'edition')) { b.raw('(' + val(f, 'edition') + ')'); }
        b.raw('.');
        break;
      }
      case 'thesis': {
        authorPart();
        b.field('title', { required: true }); b.raw('[D]. ');
        b.field('pubPlace', { required: true }); b.raw(': ');
        b.field('institution', { required: true }); b.raw(', ');
        if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
        b.raw('.');
        break;
      }
      case 'conference': {
        authorPart();
        b.field('title', { required: true }); b.raw('[C]//');
        b.field('conferenceName', { required: true }); b.raw('. ');
        if (has(f, 'conferencePlace')) { b.field('conferencePlace'); b.raw(', '); }
        if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
        if (has(f, 'pages')) { b.raw(': '); b.field('pages'); }
        b.raw('.');
        break;
      }
      case 'archive': {
        authorPart();
        b.field('title', { required: true }); b.raw('[A]. ');
        if (has(f, 'archiveNo')) { b.field('archiveNo'); b.raw('. '); }
        b.field('archivePlace', { required: true });
        if (has(f, 'date')) { b.raw(', '); b.field('date'); }
        b.raw('.');
        break;
      }
      case 'diary': {
        authorPart();
        b.field('title', { required: true });
        if (has(f, 'volume')) { b.raw(': 第' + val(f, 'volume') + '册'); }
        b.raw('[M]. ');
        if (has(f, 'organizer')) { b.field('organizer'); b.raw(', 整理. '); }
        pubPart();
        break;
      }
      case 'quoted': {
        authorPart();
        b.field('title', { required: true }); b.raw('[M]. 转引自');
        if (has(f, 'quoteAuthor')) { b.field('quoteAuthor'); b.raw('. '); }
        b.field('quoteTitle', { required: true }); b.raw('[M]. ');
        if (has(f, 'quotePlace')) { b.field('quotePlace'); b.raw(': '); }
        b.field('quotePublisher', { required: true }); b.raw(', ');
        if (has(f, 'quoteYear')) b.raw(String(f.quoteYear)); else b.field('quoteYear', { required: true });
        if (has(f, 'quotePages')) { b.raw(': '); b.field('quotePages'); }
        b.raw('.');
        break;
      }
      case 'web': {
        authorPart();
        b.field('title', { required: true }); b.raw('[EB/OL]. ');
        if (has(f, 'pubYear')) b.raw('(' + val(f, 'pubYear') + ')');
        if (has(f, 'accessDate')) { b.raw('[' + val(f, 'accessDate') + ']. '); }
        b.field('url', { required: true }); b.raw('.');
        break;
      }
      default: break;
    }
    return b.done();
  }

  function gbtEn(b, c) {
    var f = b.f, type = c.type;
    function authorPart() {
      if (has(f, 'authors')) {
        var list = (f.authors || []).map(function (n) {
          n = String(n).trim();
          if (n.indexOf(',') >= 0) {
            var p = n.split(',');
            return p[0].toUpperCase() + ' ' + p[1].trim();
          }
          var parts = n.split(/\s+/);
          var last = parts.pop();
          return last.toUpperCase() + ' ' + parts.map(function (w) { return w ? w[0].toUpperCase() : ''; }).join(' ').replace(/\s+/g, ' ').trim();
        });
        if (list.length > 3) list = [list[0], 'et al'];
        b.raw(list.join(', '));
        var role = val(f, 'authorRole');
        if (role === 'ed' || role === 'eds') b.raw(', ' + role + '.');
        b.raw('. ');
      }
    }
    function pubPart() {
      b.field('pubPlace', { required: true }); b.raw(': ');
      b.field('publisher', { required: true }); b.raw(', ');
      if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
      if (has(f, 'pages')) { b.raw(': '); b.field('pages'); }
      b.raw('.');
    }
    switch (type) {
      case 'book': {
        authorPart();
        var t = has(f, 'titleSc') ? val(f, 'titleSc') : (has(f, 'title') ? sentenceCase(val(f, 'title')) : '');
        b.segs.push(Seg(t || '【缺：title】', !has(f, 'title'), b.isUnc('title'), true));
        b.raw('[M]. ');
        if (has(f, 'translator')) { b.field('translator'); b.raw(', trans. '); }
        pubPart();
        break;
      }
      case 'journal': {
        authorPart();
        b.field('title', { required: true }); b.raw('[J]. ');
        b.field('containerTitle', { required: true, i: true }); b.raw(', ');
        if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
        if (has(f, 'volume') && has(f, 'issue')) { b.raw(', ' + val(f, 'volume') + '(' + val(f, 'issue') + ')'); }
        else if (has(f, 'issue')) { b.raw('(' + val(f, 'issue') + ')'); }
        if (has(f, 'pages')) { b.raw(': '); b.field('pages'); }
        else b.field('pages', { required: true });
        b.raw('.');
        break;
      }
      case 'thesis': {
        authorPart();
        b.field('title', { required: true }); b.raw('[D]. ');
        b.field('institution', { required: true }); b.raw(', ');
        if (has(f, 'pubYear')) b.raw(String(f.pubYear)); else b.field('pubYear', { required: true });
        b.raw('.');
        break;
      }
      case 'web': {
        authorPart();
        b.field('title', { required: true }); b.raw('[EB/OL]. ');
        if (has(f, 'accessDate')) { b.raw('[' + val(f, 'accessDate') + ']. '); }
        b.field('url', { required: true }); b.raw('.');
        break;
      }
      case 'archive': {
        authorPart();
        b.field('title', { required: true }); b.raw('[A]. ');
        b.field('archiveNo', { required: true }); b.raw(', ');
        b.field('archivePlace', { required: true });
        if (has(f, 'date')) { b.raw(', '); b.field('date'); }
        b.raw('.');
        break;
      }
      default:
        return gbtZh(b, c);
    }
    return b.done();
  }

  function renderGbt(citation, opts) {
    var b = new Builder(citation);
    var notes = [];
    var lang = citation.lang || 'zh';
    var out;
    if (isOther(lang)) {
      notes.push('该语种已按中文 GB/T 7714 规则转换，请人工核对。');
      out = gbtZh(b, citation);
    } else if (lang === 'en') out = gbtEn(b, citation);
    else out = gbtZh(b, citation);
    out.notes = out.notes.concat(notes);
    return out;
  }

  // ============================================================
  // APA 7th
  // ============================================================
  function renderApa(citation, opts) {
    var b = new Builder(citation);
    var f = b.f, type = citation.type;
    var notes = [];
    var lang = citation.lang || 'zh';
    var special = ['ancient', 'archive', 'diary', 'quoted', 'preface', 'conference'];
    if (special.indexOf(type) >= 0 && lang !== 'en') {
      notes.push('APA 对该文献类型无官方专条，已按通行惯例转换，请人工核对。');
    }
    if (isOther(lang)) notes.push('该语种已按英文 APA 规则转换，请人工核对。');
    var en = (lang === 'en' || isOther(lang));

    function authors() {
      var s;
      if (en) {
        s = apaAuthors(f.authors);
        var role = val(f, 'authorRole');
        if (s && role === 'ed') s += ' (Ed.)';
        else if (s && role === 'eds') s += ' (Eds.)';
      } else s = has(f, 'authors') ? (f.authors || []).join(', ') : '';
      if (s) b.raw(s.replace(/\.+$/, '') + '. ');
    }
    function year() {
      b.raw('(');
      if (has(f, 'date') && /年.*月.*日/.test(String(f.date))) b.raw(isoDate(val(f, 'date')));
      else if (has(f, 'pubYear')) b.raw(String(f.pubYear));
      else if (has(f, 'date')) b.raw(isoDate(val(f, 'date')));
      else b.field('pubYear', { required: true });
      b.raw('). ');
    }
    function titleApa(i) {
      if (en) {
        var t = has(f, 'titleSc') ? val(f, 'titleSc') : (has(f, 'title') ? sentenceCase(val(f, 'title')) : '');
        b.segs.push(Seg(t || '【缺：title】', !has(f, 'title'), b.isUnc('title'), !!i));
      } else b.field('title', { required: true });
    }

    switch (type) {
      case 'book': {
        authors(); year();
        titleApa(true);
        b.raw('. ');
        if (has(f, 'edition')) { b.raw('(' + val(f, 'edition') + (en ? ' ed.' : '') + '). '); }
        b.field('publisher', { required: true });
        b.raw('.');
        break;
      }
      case 'chapter': {
        authors(); year();
        titleApa(false);
        b.raw('. In ');
        if (has(f, 'editor')) {
          var eds = String(f.editor).split(/[、,，;；]/).filter(Boolean);
          var edStr;
          if (en) edStr = (eds.length > 1 ? eds.map(lastNameFirst).join(', ') : lastNameFirst(eds[0])) + (eds.length > 1 ? ' (Eds.)' : ' (Ed.)');
          else edStr = val(f, 'editor');
          b.raw(edStr);
        } else b.field('editor', { required: true });
        b.raw(', ');
        b.field('containerTitle', { required: true, i: en });
        if (en) {
          b.raw(' (');
          if (has(f, 'pages')) b.raw('pp. ' + normalizeRange(val(f, 'pages')));
          else b.field('pages', { required: true });
          b.raw('). ');
        } else {
          b.raw('（');
          if (has(f, 'pages')) b.raw('第' + val(f, 'pages') + '页');
          else b.field('pages', { required: true });
          b.raw('）. ');
        }
        b.field('publisher', { required: true });
        b.raw('.');
        break;
      }
      case 'preface': {
        authors(); year();
        titleApa(true);
        b.raw('. ');
        b.field('publisher', { required: true });
        b.raw('.');
        break;
      }
      case 'journal': {
        authors(); year();
        titleApa(false);
        b.raw('. ');
        b.field('containerTitle', { required: true, i: en });
        b.raw(', ');
        if (has(f, 'volume') && has(f, 'issue')) b.raw(val(f, 'volume') + '(' + val(f, 'issue') + ')');
        else if (has(f, 'issue')) b.raw('(' + val(f, 'issue') + ')');
        else if (has(f, 'volume')) b.raw(val(f, 'volume'));
        b.raw(', ');
        if (has(f, 'pages')) b.raw(normalizeRange(val(f, 'pages')));
        else b.field('pages', { required: true });
        b.raw('.');
        break;
      }
      case 'newspaper': {
        authors(); year();
        titleApa(false);
        b.raw('. ');
        b.field('containerTitle', { required: true, i: en });
        if (has(f, 'edition')) { b.raw(', '); b.field('edition'); }
        b.raw('.');
        break;
      }
      case 'thesis': {
        authors(); year();
        titleApa(true);
        b.raw('[');
        if (has(f, 'degree')) b.raw(val(f, 'degree') + '学位论文');
        else b.raw(en ? 'Doctoral dissertation' : '学位论文');
        b.raw(', ');
        b.field('institution', { required: true });
        b.raw('].');
        break;
      }
      case 'conference': {
        authors(); year();
        titleApa(true);
        b.raw('[');
        b.field('conferenceName', { required: true });
        if (has(f, 'conferencePlace')) { b.raw(', '); b.field('conferencePlace'); }
        b.raw('].');
        break;
      }
      case 'archive': {
        b.field('title', { required: true });
        b.raw('['); b.raw(en ? 'Archival material' : '档案'); b.raw(']. ');
        b.field('archiveNo', { required: true });
        b.raw(', ');
        b.field('archivePlace', { required: true });
        b.raw('.');
        break;
      }
      case 'diary': {
        authors(); year();
        titleApa(true);
        if (has(f, 'volume')) { b.raw(' (Vol. ' + val(f, 'volume') + ')'); }
        b.raw('. ');
        b.field('publisher', { required: true });
        b.raw('.');
        break;
      }
      case 'quoted': {
        authors(); year();
        titleApa(true);
        b.raw('. ' + (en ? 'Quoted in ' : '转引自'));
        if (has(f, 'quoteAuthor')) { b.raw(en ? lastNameFirst(val(f, 'quoteAuthor')) : val(f, 'quoteAuthor')); b.raw('. '); }
        b.field('quoteTitle', { required: true });
        b.raw('. ');
        if (has(f, 'quotePublisher')) { b.field('quotePublisher'); b.raw(', '); }
        if (has(f, 'quoteYear')) b.raw(val(f, 'quoteYear')); else b.field('quoteYear', { required: true });
        b.raw('.');
        break;
      }
      case 'ancient': {
        authors(); year();
        titleApa(true);
        if (has(f, 'version')) { b.raw(' (' + val(f, 'version') + ')'); }
        b.raw('. ');
        if (has(f, 'publisher')) b.field('publisher');
        else b.field('publisher', { required: true });
        b.raw('.');
        break;
      }
      case 'web': {
        authors(); year();
        titleApa(false);
        b.raw('. ');
        if (has(f, 'accessDate')) { b.raw((en ? 'Retrieved ' : '检索于') + val(f, 'accessDate') + ', from '); }
        b.field('url', { required: true });
        break;
      }
      default: break;
    }
    var out = b.done();
    out.notes = out.notes.concat(notes);
    return out;
  }

  // ============================================================
  // MLA 9th
  // ============================================================
  function renderMla(citation, opts) {
    var b = new Builder(citation);
    var f = b.f, type = citation.type;
    var notes = [];
    var lang = citation.lang || 'zh';
    var special = ['ancient', 'archive', 'diary', 'quoted', 'preface', 'conference'];
    if (special.indexOf(type) >= 0 && lang !== 'en') {
      notes.push('MLA 对该文献类型无官方专条，已按通行惯例转换，请人工核对。');
    }
    if (isOther(lang)) notes.push('该语种已按英文 MLA 规则转换，请人工核对。');
    var en = (lang === 'en' || isOther(lang));

    function authors() {
      var s = en ? mlaAuthors(f.authors) : (has(f, 'authors') ? (f.authors || []).join(', ') : '');
      if (s) b.raw(s.replace(/\.+$/, '') + '. ');
    }
    function year() {
      if (has(f, 'pubYear')) b.raw(String(f.pubYear) + (en ? '' : '年'));
      else if (has(f, 'date')) b.raw(String(f.date));
      else b.field('pubYear', { required: true });
    }
    function titleMla() {
      if (en) { b.field('title', { required: true, i: true }); b.raw('. '); }
      else { b.raw('《'); b.field('title', { required: true }); b.raw('》. '); }
    }
    function articleTitle() {
      if (en) { b.raw('“'); b.field('title', { required: true }); b.raw('.” '); }
      else { b.raw('《'); b.field('title', { required: true }); b.raw('》. '); }
    }
    function containerMla() {
      if (en) b.field('containerTitle', { required: true, i: true });
      else { b.raw('《'); b.field('containerTitle', { required: true }); b.raw('》'); }
    }

    switch (type) {
      case 'book': {
        authors();
        titleMla();
        if (has(f, 'edition')) { b.raw(val(f, 'edition') + ', '); }
        if (has(f, 'publisher')) { b.field('publisher'); b.raw(', '); }
        year(); b.raw('.');
        break;
      }
      case 'chapter': {
        authors();
        articleTitle();
        containerMla();
        if (has(f, 'editor')) {
          b.raw(', ' + (en ? 'edited by ' : ''));
          b.field('editor');
        }
        if (has(f, 'volume')) { b.raw(en ? ', vol. ' + val(f, 'volume') : ', ' + zhUnit(f.volume, '卷')); }
        b.raw(', ');
        if (has(f, 'publisher')) { b.field('publisher'); b.raw(', '); }
        year(); b.raw(', ');
        if (has(f, 'pages')) { b.raw(en ? 'pp. ' + normalizeRange(val(f, 'pages')) : '第' + val(f, 'pages') + '页'); }
        else b.field('pages', { required: true });
        b.raw('.');
        break;
      }
      case 'preface': {
        authors();
        titleMla();
        if (has(f, 'publisher')) { b.field('publisher'); b.raw(', '); }
        year(); b.raw('.');
        break;
      }
      case 'journal': {
        authors();
        articleTitle();
        containerMla();
        if (en) {
          if (has(f, 'volume')) { b.raw(', vol. ' + val(f, 'volume')); }
          if (has(f, 'issue')) { b.raw(', no. ' + val(f, 'issue')); }
          b.raw(', ');
          year();
        } else {
          b.raw(', ');
          year();
          if (has(f, 'issue')) { b.raw(', ' + zhUnit(f.issue, '期')); }
          else if (has(f, 'volume')) { b.raw(', ' + zhUnit(f.volume, '卷')); }
        }
        b.raw(', ');
        if (has(f, 'pages')) { b.raw(en ? 'pp. ' + normalizeRange(val(f, 'pages')) : '第' + val(f, 'pages') + '页'); }
        else b.field('pages', { required: true });
        b.raw('.');
        break;
      }
      case 'newspaper': {
        authors();
        articleTitle();
        containerMla();
        b.raw(', ');
        b.field('date', { required: true });
        if (has(f, 'edition')) { b.raw(', ' + (en ? 'p. ' : '第') + val(f, 'edition') + (en ? '' : '版')); }
        b.raw('.');
        break;
      }
      case 'thesis': {
        authors();
        articleTitle();
        b.raw(en ? 'PhD dissertation, ' : (has(f, 'degree') ? val(f, 'degree') + '学位论文, ' : '学位论文, '));
        b.field('institution', { required: true });
        b.raw(', ');
        year(); b.raw('.');
        break;
      }
      case 'conference': {
        authors();
        articleTitle();
        b.field('conferenceName', { required: true });
        if (has(f, 'conferencePlace')) { b.raw(', '); b.field('conferencePlace'); }
        b.raw(', ');
        year(); b.raw('.');
        break;
      }
      case 'archive': {
        authors();
        b.field('title', { required: true });
        b.raw('. ');
        b.field('archiveNo', { required: true });
        b.raw(', ');
        b.field('archivePlace', { required: true });
        if (has(f, 'date')) { b.raw(', '); b.field('date'); }
        b.raw('.');
        break;
      }
      case 'diary': {
        authors();
        titleMla();
        if (has(f, 'volume')) { b.raw(en ? 'vol. ' + val(f, 'volume') + ', ' : zhUnit(f.volume, '册') + ', '); }
        if (has(f, 'publisher')) { b.field('publisher'); b.raw(', '); }
        year(); b.raw('.');
        break;
      }
      case 'quoted': {
        authors();
        articleTitle();
        b.raw(en ? 'Quoted in ' : '转引自');
        if (has(f, 'quoteAuthor')) { b.field('quoteAuthor'); b.raw('. '); }
        b.field('quoteTitle', { required: true });
        b.raw('. ');
        if (has(f, 'quotePublisher')) { b.field('quotePublisher'); b.raw(', '); }
        if (has(f, 'quoteYear')) b.raw(String(f.quoteYear) + (en ? '' : '年')); else b.field('quoteYear', { required: true });
        b.raw('.');
        break;
      }
      case 'ancient': {
        authors();
        titleMla();
        if (has(f, 'version')) { b.raw(val(f, 'version') + ', '); }
        if (has(f, 'publisher')) { b.field('publisher'); b.raw(', '); }
        year(); b.raw('.');
        break;
      }
      case 'web': {
        authors();
        articleTitle();
        if (has(f, 'pubYear')) { b.raw(String(f.pubYear) + ', '); }
        b.field('url', { required: true });
        b.raw('. ');
        if (has(f, 'accessDate')) { b.raw((en ? 'Accessed ' : '访问于') + val(f, 'accessDate') + '.'); }
        break;
      }
      default: break;
    }
    var out = b.done();
    out.notes = out.notes.concat(notes);
    return out;
  }

  // ============================================================
  // 文内引用（in-text citation）
  // ============================================================
  function enLastName(name) {
    name = String(name || '').trim();
    if (name.indexOf(',') >= 0) return name.split(',')[0].trim();
    var parts = name.split(/\s+/);
    return parts[parts.length - 1];
  }
  function digitsYear(y) {
    var m = String(y || '').match(/\d{4}/);
    return m ? m[0] : '';
  }

  function renderInText(citation, format) {
    var lang = citation.lang || 'zh';
    var en = lang === 'en' || isOther(lang);
    var f = citation.fields || {};
    var year = digitsYear(val(f, 'pubYear'));
    var pages = val(f, 'pages');
    var list = f.authors || [];
    var title = val(f, 'title');
    var tSc = has(f, 'titleSc') ? val(f, 'titleSc') : title;
    var noAuthor = !list.length;
    var titleFallback = en ? tSc : '《' + title + '》';

    function apaAuth(parenForm) {
      if (noAuthor) return titleFallback;
      if (en) {
        if (list.length === 1) return enLastName(list[0]);
        if (list.length === 2) return enLastName(list[0]) + (parenForm ? ' & ' : ' and ') + enLastName(list[1]);
        return enLastName(list[0]) + ' et al.';
      }
      if (list.length === 1) return list[0];
      if (list.length === 2) return list[0] + '和' + list[1];
      return list[0] + '等';
    }
    function mlaAuth() {
      if (noAuthor) return titleFallback;
      if (en) {
        if (list.length === 1) return enLastName(list[0]);
        if (list.length === 2) return enLastName(list[0]) + ' and ' + enLastName(list[1]);
        return enLastName(list[0]) + ' et al.';
      }
      if (list.length === 1) return list[0];
      if (list.length === 2) return list[0] + '和' + list[1];
      return list[0] + '等';
    }
    function gbtAuth() {
      if (noAuthor) return titleFallback;
      if (en) {
        var names = list.map(enLastName);
        var n = names.length > 3 ? [names[0] + ' et al.'] : names;
        return n.join(', ').toUpperCase();
      }
      var z = list.length > 3 ? [list[0] + '等'] : list.slice();
      return z.join('、');
    }
    function apaPage() {
      if (!pages) return '';
      if (en) {
        var p = String(pages).replace(/^p+\.?\s*/i, '').trim();
        var isR = /[-–—,]/.test(p);
        return (isR ? 'pp. ' : 'p. ') + normalizeRange(p);
      }
      return zhPages(pages);
    }
    function mlaPage() {
      if (!pages) return '';
      return String(pages).replace(/^p+\.?\s*/i, '').trim();
    }

    if (format === 'apa') {
      var pg = apaPage();
      var yearPart = year ? (en ? ', ' + year : '，' + year) : '';
      var pgPart = pg ? (en ? ', ' + pg : '，' + pg) : '';
      return {
        paren: (en ? '(' : '（') + apaAuth(true) + yearPart + pgPart + (en ? ')' : '）'),
        narrative: apaAuth(false) + (en ? ' (' : '（') + year + pgPart + (en ? ')' : '）')
      };
    }
    if (format === 'mla') {
      var a2 = mlaAuth();
      var pg2 = mlaPage();
      return {
        paren: (en ? '(' : '（') + a2 + (pg2 ? ' ' + pg2 : '') + (en ? ')' : '）'),
        narrative: a2 + (pg2 ? (en ? ' (' : '（') + pg2 + (en ? ')' : '）') : '')
      };
    }
    if (format === 'gbt') {
      var a3 = gbtAuth();
      return {
        authYear: (en ? '(' : '（') + a3 + (year ? (en ? ', ' : '，') + year : '') + (en ? ')' : '）')
      };
    }
    return {};
  }

  // ============================================================
  // 入口
  // ============================================================
  function render(citation, format, opts) {
    opts = opts || {};
    var f = citation && citation.fields || {};
    if (has(f, 'seePrefix')) {
      var prefix = val(f, 'seePrefix');
      var clone = JSON.parse(JSON.stringify(citation));
      delete clone.fields.seePrefix;
      var inner = render(clone, format, opts);
      return {
        segments: [Seg(prefix, false, false, false)].concat(inner.segments),
        text: prefix + inner.text,
        notes: inner.notes
      };
    }
    if (format === 'lsyj') return renderLsyj(citation, opts);
    if (format === 'gbt') return renderGbt(citation, opts);
    if (format === 'apa') return renderApa(citation, opts);
    if (format === 'mla') return renderMla(citation, opts);
    return renderLsyj(citation, opts);
  }

  function citationKey(c) {
    var f = c.fields || {};
    return [c.lang, c.type, (f.authors || []).join('|'), f.title, f.pubYear, f.containerTitle]
      .join('§').toLowerCase().replace(/\s+/g, '');
  }

  function markDuplicates(citations) {
    var seen = {};
    citations.forEach(function (c, i) {
      var k = citationKey(c);
      if (k && seen[k] !== undefined) c.duplicateOf = seen[k];
      else if (k) seen[k] = i;
    });
    return citations;
  }

  return {
    render: render,
    renderInText: renderInText,
    citationKey: citationKey,
    markDuplicates: markDuplicates,
    FORMATS: FORMATS,
    FORMAT_LABELS: FORMAT_LABELS,
    TYPE_LABELS: TYPE_LABELS,
    ANCIENT_LABELS: ANCIENT_LABELS,
    zhPages: zhPages,
    zhYear: zhYear,
    isoDate: isoDate,
    sentenceCase: sentenceCase,
    lastNameFirst: lastNameFirst,
    enPages: enPages,
    jaPages: jaPages
  };
});
