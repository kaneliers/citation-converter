'use strict';
const R = require('../renderer/rules.js');

let pass = 0, fail = 0;
const failures = [];

function eq(name, actual, expected) {
  if (actual === expected) { pass++; }
  else { fail++; failures.push({ name, actual, expected }); }
}

function cite(o) {
  return { lang: o.lang || 'zh', type: o.type, ancientSubtype: o.sub, fields: o.fields || {}, missing: o.missing || [], uncertain: o.uncertain || [] };
}
function t(name, o, format, opts, expected) {
  const r = R.render(cite(o), format || 'lsyj', opts || {});
  eq(name + ' (' + (format || 'lsyj') + ')', r.text, expected);
  return r;
}
function missingIn(name, o, format, opts, label) {
  const r = R.render(cite(o), format || 'lsyj', opts || {});
  const found = r.segments.some(s => s.m && s.v.indexOf(label) >= 0);
  if (found) pass++; else { fail++; failures.push({ name: name + ' [missing]', actual: r.text, expected: 'missing label: ' + label }); }
}

// ================= 《历史研究》中文 =================
t('著作-单作者', { type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', publisher: '北新书局', pubYear: '1948', pages: '43' } }, 'lsyj', {},
  '赵景深：《文坛忆旧》，上海：北新书局，1948年，第43页。');

t('著作-主编', { type: 'book', fields: { authors: ['金冲及'], authorRole: '主编', title: '周恩来传', pubPlace: '北京', publisher: '人民出版社、中央文献出版社', pubYear: '1989', pages: '9' } }, 'lsyj', {},
  '金冲及主编：《周恩来传》，北京：人民出版社、中央文献出版社，1989年，第9页。');

t('著作-译著', { type: 'book', fields: { authors: ['实藤惠秀'], title: '中国人留学日本史', translator: '谭汝谦、林启彦', pubPlace: '香港', publisher: '中文大学出版社', pubYear: '1982', pages: '11—12' } }, 'lsyj', {},
  '实藤惠秀：《中国人留学日本史》，谭汝谦、林启彦译，香港：中文大学出版社，1982年，第11—12页。');

t('著作-出版时间不详', { type: 'book', fields: { authors: ['狄葆贤'], title: '平等阁笔记', pubPlace: '上海', publisher: '有正书局', pubYear: '不详', pages: '8' } }, 'lsyj', {},
  '狄葆贤：《平等阁笔记》，上海：有正书局，出版时间不详，第8页。');

t('著作-经典著作无作者', { type: 'book', fields: { title: '马克思恩格斯全集', volume: '31', volumeUnit: '卷', pubPlace: '北京', publisher: '人民出版社', pubYear: '1998', pages: '46' } }, 'lsyj', {},
  '《马克思恩格斯全集》第31卷，北京：人民出版社，1998年，第46页。');

t('析出文献', { type: 'chapter', fields: { authors: ['杜威·佛克马'], title: '走向新世界主义', editor: '王宁、薛晓源', editorRole: '编', containerTitle: '全球化与后殖民批评', pubPlace: '北京', publisher: '中央编译出版社', pubYear: '1999', pages: '247—266' } }, 'lsyj', {},
  '杜威·佛克马：《走向新世界主义》，王宁、薛晓源编：《全球化与后殖民批评》，北京：中央编译出版社，1999年，第247—266页。');

t('析出文献-同责任者省略', { type: 'chapter', fields: { authors: ['鲁迅'], title: '中国小说的历史的变迁', containerTitle: '鲁迅全集', volume: '9', volumeUnit: '册', pubPlace: '北京', publisher: '人民文学出版社', pubYear: '1981', pages: '325' } }, 'lsyj', {},
  '鲁迅：《中国小说的历史的变迁》，《鲁迅全集》第9册，北京：人民文学出版社，1981年，第325页。');

t('序言-同作者', { type: 'preface', fields: { authors: ['李鹏程'], title: '当代文化哲学沉思', partTitle: '序言', pubPlace: '北京', publisher: '人民出版社', pubYear: '1994', pages: '1' } }, 'lsyj', {},
  '李鹏程：《当代文化哲学沉思》，北京：人民出版社，1994年，“序言”，第1页。');

t('序言-单独标题按析出', { type: 'chapter', fields: { authors: ['楼适夷'], title: '读家书，想傅雷（代序）', editor: '傅敏', editorRole: '编', containerTitle: '傅雷家书', edition: '增补本', pubPlace: '北京', publisher: '三联书店', pubYear: '1988', pages: '2' } }, 'lsyj', {},
  '楼适夷：《读家书，想傅雷（代序）》，傅敏编：《傅雷家书》（增补本），北京：三联书店，1988年，第2页。');

t('古籍-刻本', { type: 'ancient', sub: 'keben', fields: { authors: ['姚际恒'], title: '古今伪书考', volume: '3', version: '光绪三年苏州文学山房活字本', pages: '9a' } }, 'lsyj', {},
  '姚际恒：《古今伪书考》卷3，光绪三年苏州文学山房活字本，第9页a。');

t('古籍-点校本', { type: 'ancient', sub: 'dianjiao', fields: { authors: ['毛祥麟'], title: '墨余录', collator: '毕万忱', pubPlace: '上海', publisher: '上海古籍出版社', pubYear: '1985', pages: '35' } }, 'lsyj', {},
  '毛祥麟：《墨余录》，毕万忱点校，上海：上海古籍出版社，1985年，第35页。');

t('古籍-影印本', { type: 'ancient', sub: 'yingyin', fields: { authors: ['杨钟羲'], title: '雪桥诗话续集', volume: '5', pubPlace: '沈阳', publisher: '辽沈书社', pubYear: '1991', physicalPart: '上册', pages: '461', column: '下栏' } }, 'lsyj', {},
  '杨钟羲：《雪桥诗话续集》卷5，沈阳：辽沈书社，1991年影印本，上册，第461页下栏。');

t('古籍-影印本无作者引文', { type: 'ancient', sub: 'yingyin', fields: { title: '太平御览', volume: '690', partTitle: '服章部七', extra: '引《魏台访议》', pubPlace: '北京', publisher: '中华书局', pubYear: '1985', seriesVolume: '3', pages: '3080', column: '下栏' } }, 'lsyj', {},
  '《太平御览》卷690《服章部七》引《魏台访议》，北京：中华书局，1985年影印本，第3册，第3080页下栏。');

t('古籍-析出文献', { type: 'ancient', sub: 'chapter', fields: { authors: ['管志道'], title: '续问辨牍', volume: '2', partTitle: '答屠仪部赤水丈书', seriesName: '四库全书存目丛书', pubPlace: '济南', publisher: '齐鲁书社', pubYear: '1997', version: '影印本', department: '子部', seriesVolume: '88', pages: '73' } }, 'lsyj', {},
  '管志道：《续问辨牍》卷2《答屠仪部赤水丈书》，《四库全书存目丛书》，济南：齐鲁书社，1997年影印本，子部，第88册，第73页。');

t('古籍-析出同年无影印字样', { type: 'ancient', sub: 'chapter', fields: { authors: ['夏言'], title: '桂洲先生奏议', volume: '20', partTitle: '驭夷狄·请勘处倭寇事情', seriesName: '四库全书存目从书', pubPlace: '济南', publisher: '齐鲁书社', pubYear: '1997', department: '史部', seriesVolume: '60', pages: '562' } }, 'lsyj', {},
  '夏言：《桂洲先生奏议》卷20《驭夷狄·请勘处倭寇事情》，《四库全书存目从书》，济南：齐鲁书社，1997年，史部，第60册，第562页。');

t('古籍-析出编者辑', { type: 'ancient', sub: 'chapter', fields: { authors: ['冯复京'], title: '明常熟先贤事略', volume: '9', partTitle: '赵用贤', editor: '周骏富', editorRole: '辑', seriesName: '明代传记丛刊', pubPlace: '台北', publisher: '明文书局', pubYear: '1991', department: '综录类', seriesVolume: '52', pages: '91' } }, 'lsyj', {},
  '冯复京：《明常熟先贤事略》卷9《赵用贤》，周骏富辑：《明代传记丛刊》，台北：明文书局，1991年，综录类，第52册，第91页。');

t('古籍-地方志', { type: 'ancient', sub: 'gazetteer', fields: { dynastyYear: '万历', title: '广东通志', volume: '15', partTitle: '郡县志二·广州府·城池', seriesName: '稀见中国地方志汇刊', pubPlace: '北京', publisher: '中国书店', pubYear: '1992', seriesVolume: '42', pages: '367' } }, 'lsyj', {},
  '万历《广东通志》卷15《郡县志二·广州府·城池》，《稀见中国地方志汇刊》，北京：中国书店，1992年影印本，第42册，第367页。');

t('常用基本典籍', { type: 'ancient', sub: 'classic', fields: { title: '旧唐书', volume: '9', partTitle: '玄宗纪下', pubPlace: '北京', publisher: '中华书局', pubYear: '1975', version: '标点本', pages: '233' } }, 'lsyj', {},
  '《旧唐书》卷9《玄宗纪下》，北京：中华书局，1975年标点本，第233页。');

t('常用基本典籍-上册', { type: 'ancient', sub: 'classic', fields: { title: '方苞集', volume: '6', partTitle: '答程夔州书', pubPlace: '上海', publisher: '上海古籍出版社', pubYear: '1983', version: '标点本', physicalPart: '上册', pages: '166' } }, 'lsyj', {},
  '《方苞集》卷6《答程夔州书》，上海：上海古籍出版社，1983年标点本，上册，第166页。');

t('编年体典籍', { type: 'ancient', sub: 'biannian', fields: { title: '清德宗实录', volume: '435', dynastyDate: '光绪二十四年十二月上', pubPlace: '北京', publisher: '中华书局', pubYear: '1987', seriesVolume: '6', pages: '727' } }, 'lsyj', {},
  '《清德宗实录》卷435，光绪二十四年十二月上，北京：中华书局，1987年影印本，第6册，第727页。');

t('期刊-无页码', { type: 'journal', fields: { authors: ['何龄修'], title: '读顾诚〈南明史〉', containerTitle: '中国史研究', pubYear: '1998', issue: '3' } }, 'lsyj', { omitPages: true },
  '何龄修：《读顾诚〈南明史〉》，《中国史研究》1998年第3期。');

t('期刊-卷号', { type: 'journal', fields: { authors: ['梁启超'], title: '阴阳五行说之来历', containerTitle: '东方杂志', volume: '20', issue: '10', issueUnit: '号', pubYear: '1923' } }, 'lsyj', { omitPages: true },
  '梁启超：《阴阳五行说之来历》，《东方杂志》第20卷第10号，1923年。');

t('期刊-同名括注地名', { type: 'journal', fields: { authors: ['魏丽英'], title: '论近代西北人口波动的主要原因', containerTitle: '社会科学', pubPlace: '兰州', pubYear: '1990', issue: '6' } }, 'lsyj', { omitPages: true },
  '魏丽英：《论近代西北人口波动的主要原因》，《社会科学》（兰州）1990年第6期。');

t('期刊-卷期含年月', { type: 'journal', fields: { authors: ['李济'], title: '创办史语所与支持安阳考古工作的贡献', containerTitle: '传记文学', pubPlace: '台北', volume: '28', issue: '1', issueUnit: '期', pubYear: '1976年1月' } }, 'lsyj', { omitPages: true },
  '李济：《创办史语所与支持安阳考古工作的贡献》，《传记文学》（台北）第28卷第1期，1976年1月。');

t('期刊-含页码版', { type: 'journal', fields: { authors: ['何龄修'], title: '读顾诚〈南明史〉', containerTitle: '中国史研究', pubYear: '1998', issue: '3', pages: '45' } }, 'lsyj', {},
  '何龄修：《读顾诚〈南明史〉》，《中国史研究》1998年第3期，第45页。');

t('报纸', { type: 'newspaper', fields: { authors: ['李眉'], title: '李劼人轶事', containerTitle: '四川工人日报', date: '1986年8月22日', edition: '2' } }, 'lsyj', {},
  '李眉：《李劼人轶事》，《四川工人日报》1986年8月22日，第2版。');

t('报纸-无版次卷册', { type: 'newspaper', fields: { authors: ['伤心人（麦孟华）'], title: '说奴隶', containerTitle: '清议报', volume: '第69册', date: '光绪二十六年十一月二十一日', pages: '1' } }, 'lsyj', {},
  '伤心人（麦孟华）：《说奴隶》，《清议报》第69册，光绪二十六年十一月二十一日，第1页。');

t('报纸-栏目页码', { type: 'newspaper', fields: { title: '四川会议厅暂行章程', containerTitle: '广益丛报', volume: '8年第19期', date: '1910年9月3日', column: '新章', pages: '1—2' } }, 'lsyj', {},
  '《四川会议厅暂行章程》，《广益丛报》第8年第19期，1910年9月3日，“新章”，第1—2页。');

t('报纸-同名标地名', { type: 'newspaper', fields: { title: '上海各路商界总联合会致外交部电', containerTitle: '民国日报', pubPlace: '上海', date: '1925年8月14日', edition: '4' } }, 'lsyj', {},
  '《上海各路商界总联合会致外交部电》，《民国日报》（上海）1925年8月14日，第4版。');

t('报纸-多张版次', { type: 'newspaper', fields: { title: '西南中委反对在宁召开五全会', containerTitle: '民国日报', pubPlace: '广州', date: '1933年8月11日', edition: '第1张第4版' } }, 'lsyj', {},
  '《西南中委反对在宁召开五全会》，《民国日报》（广州）1933年8月11日，第1张第4版。');

t('学位论文', { type: 'thesis', fields: { authors: ['方明东'], title: '罗隆基政治思想研究（1913—1949）', degree: '博士', institution: '北京师范大学历史系', pubYear: '2000', pages: '67' } }, 'lsyj', {},
  '方明东：《罗隆基政治思想研究（1913—1949）》，博士学位论文，北京师范大学历史系，2000年，第67页。');

t('会议论文', { type: 'conference', fields: { authors: ['任东来'], title: '对国际体制和国际制度的理解和翻译', conferenceName: '全球化与亚太区域化国际研讨会', conferencePlace: '天津', date: '2000年6月', pages: '9' } }, 'lsyj', {},
  '任东来：《对国际体制和国际制度的理解和翻译》，全球化与亚太区域化国际研讨会论文，天津，2000年6月，第9页。');

t('档案文献', { type: 'archive', fields: { title: '傅良佐致国务院电', date: '1917年9月15日', archiveNo: '北洋档案 1011—5961', archivePlace: '中国第二历史档案馆' } }, 'lsyj', {},
  '《傅良佐致国务院电》，1917年9月15日，北洋档案 1011—5961，中国第二历史档案馆藏。');

t('日记-整理者', { type: 'diary', fields: { title: '翁同龢日记', volume: '6', date: '光绪二十三年十月二十三日', organizer: '陈义杰', pubPlace: '北京', publisher: '中华书局', pubYear: '1998', pages: '3058' } }, 'lsyj', {},
  '《翁同龢日记》第6册，光绪二十三年十月二十三日，陈义杰整理，北京：中华书局，1998年，第3058页。');

t('日记-编者', { type: 'diary', fields: { editor: '中国第二历史档案馆', editorRole: '编', title: '冯玉祥日记', volume: '4', pubPlace: '南京', publisher: '江苏古籍出版社', pubYear: '1992', pages: '645' } }, 'lsyj', {},
  '中国第二历史档案馆编：《冯玉祥日记》第4册，南京：江苏古籍出版社，1992年，第645页。');

t('转引文献', { type: 'quoted', fields: { authors: ['章太炎'], title: '在长沙晨光学校演说', originalInfo: '1925年10月', quoteAuthor: '汤志钧', quoteTitle: '章太炎年谱长编', quoteVolume: '下册', quotePlace: '北京', quotePublisher: '中华书局', quoteYear: '1979', quotePages: '823' } }, 'lsyj', {},
  '章太炎：《在长沙晨光学校演说》，1925年10月，转引自汤志钧：《章太炎年谱长编》下册，北京：中华书局，1979年，第823页。');

t('电子文献', { type: 'web', fields: { authors: ['王明亮'], title: '关于中国学术期刊标准化数据库系统工程的进展', url: 'http://www.cajcd.cn/pub/wml.txt/980810-2.html', accessDate: '1998年10月4日' } }, 'lsyj', {},
  '王明亮：《关于中国学术期刊标准化数据库系统工程的进展》，http://www.cajcd.cn/pub/wml.txt/980810-2.html, 访问时间：1998年10月4日。');

t('电子文献-期刊网络版', { type: 'web', fields: { authors: ['扬之水'], title: '两宋茶诗与茶事', containerTitle: '文学遗产通讯', pubPlace: '网络版试刊', pubYear: '2006', issue: '1', url: 'http://www.literature.org.cn/Article.asp?ID=199', accessDate: '2007年9月13日' } }, 'lsyj', {},
  '扬之水：《两宋茶诗与茶事》，《文学遗产通讯》（网络版试刊）2006年第1期，http://www.literature.org.cn/Article.asp?ID=199, 访问时间：2007年9月13日。');

// ================= 《历史研究》英文 =================
t('英-专著', { lang: 'en', type: 'book', fields: { authors: ['Peter Brooks'], title: 'Troubling Confessions: Speaking Guilt in Law and Literature', pubPlace: 'Chicago', publisher: 'University of Chicago Press', pubYear: '2000', pages: '48' } }, 'lsyj', {},
  'Peter Brooks, Troubling Confessions: Speaking Guilt in Law and Literature, Chicago: University of Chicago Press, 2000, p.48.');

t('英-两作者', { lang: 'en', type: 'book', fields: { authors: ['Randolph Starn', 'Loren Partridge'], title: 'The Arts of Power: Three Halls of State in Italy, 1300-1600', pubPlace: 'Berkeley', publisher: 'California University Press', pubYear: '1992', pages: '19-28' } }, 'lsyj', {},
  'Randolph Starn and Loren Partridge, The Arts of Power: Three Halls of State in Italy, 1300-1600, Berkeley: California University Press, 1992, pp.19-28.');

t('英-et al.', { lang: 'en', type: 'book', fields: { authors: ['Julie Evans', 'Patricia Grimshaw', 'David Phillips', 'Shurlee Swain'], title: 'Equal Subjects, Unequal Right: Indigenous Peoples in British Settler Societies', pubPlace: 'Manchester', publisher: 'Manchester University Press', pubYear: '2003', pages: '25' } }, 'lsyj', {},
  'Julie Evans et al., Equal Subjects, Unequal Right: Indigenous Peoples in British Settler Societies, Manchester: Manchester University Press, 2003, p.25.');

t('英-编者ed.', { lang: 'en', type: 'book', fields: { authors: ['Peter Burke'], authorRole: 'ed', title: 'New Perspectives on Historical Writing', pubPlace: 'University Park', publisher: 'Pennsylvania State University Press', pubYear: '2001' } }, 'lsyj', { omitPages: true },
  'Peter Burke, ed., New Perspectives on Historical Writing, University Park: Pennsylvania State University Press, 2001.');

t('英-编者eds.', { lang: 'en', type: 'book', fields: { authors: ['T. H. Aston', 'C. H. E. Philpin'], authorRole: 'eds', title: 'The Brenner Debate', pubPlace: 'Cambridge', publisher: 'Cambridge University Press', pubYear: '1985', pages: '35' } }, 'lsyj', {},
  'T. H. Aston and C. H. E. Philpin, eds., The Brenner Debate, Cambridge: Cambridge University Press, 1985, p.35.');

t('英-版次', { lang: 'en', type: 'book', fields: { authors: ['Nancy F. Cott'], title: 'The Bonds of Womanhood: “Women’s Sphere” in New England, 1780-1835', edition: '2nd ed.', pubPlace: 'New Haven', publisher: 'Yale University Press', pubYear: '1997' } }, 'lsyj', { omitPages: true },
  'Nancy F. Cott, The Bonds of Womanhood: “Women’s Sphere” in New England, 1780-1835, 2nd ed., New Haven: Yale University Press, 1997.');

t('英-译著', { lang: 'en', type: 'book', fields: { authors: ['M. Polo'], title: 'The Travels of Marco Polo', translator: 'William Marsden', pubPlace: 'Hertfordshire', publisher: 'Cumberland House', pubYear: '1997', pages: '55, 88' } }, 'lsyj', {},
  'M. Polo, The Travels of Marco Polo, trans. William Marsden, Hertfordshire: Cumberland House, 1997, pp.55, 88.');

t('英-期刊', { lang: 'en', type: 'journal', fields: { authors: ['Heath B. Chamberlain'], title: 'On the Search for Civil Society in China', containerTitle: 'Modern China', volume: '19', issue: '2', pubYear: '1993', pages: '199-215' } }, 'lsyj', {},
  'Heath B. Chamberlain, “On the Search for Civil Society in China,” Modern China, Vol. 19, No. 2, 1993, pp.199-215.');

t('英-文集析出', { lang: 'en', type: 'chapter', fields: { authors: ['R. S. Schofield'], title: 'The Impact of Scarcity and Plenty on Population Change in England', editor: 'R. I. Rotberg and T. K. Rabb', editorRole: 'eds', containerTitle: 'Hunger and History: The Impact of Changing Food Production and Consumption Pattern on Society', pubPlace: 'Cambridge, Mass', publisher: 'Cambridge University Press', pubYear: '1983', pages: '79' } }, 'lsyj', {},
  'R. S. Schofield, “The Impact of Scarcity and Plenty on Population Change in England,” in R. I. Rotberg and T. K. Rabb, eds., Hunger and History: The Impact of Changing Food Production and Consumption Pattern on Society, Cambridge, Mass: Cambridge University Press, 1983, p.79.');

t('英-档案', { lang: 'en', type: 'archive', fields: { title: 'Nixon to Kissinger', date: 'February 1, 1969', archiveNo: 'Box 1032, NSC Files, Nixon Presidential Material Project (NPMP)', archivePlace: 'National Archives II, College Park, MD' } }, 'lsyj', {},
  'Nixon to Kissinger, February 1, 1969, Box 1032, NSC Files, Nixon Presidential Material Project (NPMP), National Archives II, College Park, MD.');

t('英-学位论文', { lang: 'en', type: 'thesis', fields: { authors: ['Melinda Schwenk-Borrell'], title: 'Selling Democracy: The USIA’s Portrayal of American Race Relations, 1953–1976', institution: 'University of Pennsylvania', pubYear: '2004' } }, 'lsyj', {},
  'Melinda Schwenk-Borrell, “Selling Democracy: The USIA’s Portrayal of American Race Relations, 1953–1976,” Ph.D. dissertation, University of Pennsylvania, 2004.');

// ================= 《历史研究》日文 =================
t('日-专著', { lang: 'ja', type: 'book', fields: { authors: ['小野五郎'], title: '現代日本の産業政策一段階別決定刃のメカニズムー', pubPlace: '東京', publisher: '日本経済新聞社', pubYear: '1999', pages: '27' } }, 'lsyj', {},
  '小野五郎：『現代日本の産業政策一段階別決定刃のメカニズムー』、東京：日本経済新聞社、1999年、第27頁。');

t('日-论文集', { lang: 'ja', type: 'chapter', fields: { authors: ['郡司隆男'], title: '言語情報の特質', editor: '藤本和貴夫·木村健治', editorRole: '編', containerTitle: '言語文化学概論', pubPlace: '大阪', publisher: '大阪大学出版会', pubYear: '1997', pages: '20' } }, 'lsyj', {},
  '郡司隆男：「言語情報の特質」、藤本和貴夫·木村健治編：『言語文化学概論』、大阪：大阪大学出版会、1997年、第20頁。');

t('日-期刊', { lang: 'ja', type: 'journal', fields: { authors: ['梅津彰人'], title: 'キャンパスの文章—卒業論文', containerTitle: '国文学 解釈と教材の研究', volume: '40', issue: '2', pubYear: '1955', pages: '71—74' } }, 'lsyj', {},
  '梅津彰人：「キャンパスの文章—卒業論文」、『国文学 解釈と教材の研究』第40巻第2号、1955年、第71—74頁。');

t('日-档案', { lang: 'ja', type: 'archive', fields: { title: '参謀次長宛町田少将電報', date: '1916年2月17日', archiveNo: '袁世凱帝制計画一件（極秘）／反袁動乱及各地状況', volume: '4', pages: '72', archivePlace: 'JACAR（アジア歴史資料センター）', extra: 'B03050721400' } }, 'lsyj', {},
  '「参謀次長宛町田少将電報」（1916年2月17日）、『袁世凱帝制計画一件（極秘）／反袁動乱及各地状況』第4巻、第72頁、JACAR（アジア歴史資料センター）、Ref. B03050721400。');

t('日-网页', { lang: 'ja', type: 'web', fields: { authors: ['経済産業省産業技術環境局産業技術政策課'], title: '経済産業省産業技術政策', url: 'http://www.meti.go.jp/policy/economy/gijutsu_kakushin/innocation_policy/pdf/pamphlet.pdf', accessDate: '2015年8月6日' } }, 'lsyj', {},
  '経済産業省産業技術環境局産業技術政策課：「経済産業省産業技術政策」、http://www.meti.go.jp/policy/economy/gijutsu_kakushin/innocation_policy/pdf/pamphlet.pdf、访问时间：2015年8月6日。');

// ================= 再次引用简式 =================
t('简式-著作', { type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', publisher: '北新书局', pubYear: '1948', pages: '24' } }, 'lsyj', { simple: true },
  '赵景深：《文坛忆旧》，第24页。');

t('简式-析出', { type: 'chapter', fields: { authors: ['鲁迅'], title: '中国小说的历史的变迁', containerTitle: '鲁迅全集', volume: '9', volumeUnit: '册', pubPlace: '北京', publisher: '人民文学出版社', pubYear: '1981', pages: '326' } }, 'lsyj', { simple: true },
  '鲁迅：《中国小说的历史的变迁》，《鲁迅全集》第9册，第326页。');

t('简式-英文专著', { lang: 'en', type: 'book', fields: { authors: ['Peter Brooks'], title: 'Troubling Confessions: Speaking Guilt in Law and Literature', pages: '48' } }, 'lsyj', { simple: true },
  'Peter Brooks, Troubling Confessions: Speaking Guilt in Law and Literature, p.48.');

t('简式-英文期刊', { lang: 'en', type: 'journal', fields: { authors: ['R. S. Schofield'], title: 'The Impact of Scarcity and Plenty on Population Change in England', pages: '79' } }, 'lsyj', { simple: true },
  'R. S. Schofield, “The Impact of Scarcity and Plenty on Population Change in England,” p.79.');

t('简式-中文期刊', { type: 'journal', fields: { authors: ['何龄修'], title: '读顾诚〈南明史〉', containerTitle: '中国史研究', pubYear: '1998', issue: '3', pages: '45' } }, 'lsyj', { simple: true },
  '何龄修：《读顾诚〈南明史〉》，第45页。');

t('简式-报纸', { type: 'newspaper', fields: { authors: ['李眉'], title: '李劼人轶事', containerTitle: '四川工人日报', date: '1986年8月22日', edition: '2' } }, 'lsyj', { simple: true },
  '李眉：《李劼人轶事》，第2版。');

t('简式-学位论文', { type: 'thesis', fields: { authors: ['方明东'], title: '罗隆基政治思想研究（1913—1949）', degree: '博士', institution: '北京师范大学历史系', pubYear: '2000', pages: '67' } }, 'lsyj', { simple: true },
  '方明东：《罗隆基政治思想研究（1913—1949）》，第67页。');

t('简式-档案', { type: 'archive', fields: { title: '傅良佐致国务院电', date: '1917年9月15日', archiveNo: '北洋档案 1011—5961', archivePlace: '中国第二历史档案馆' } }, 'lsyj', { simple: true },
  '《傅良佐致国务院电》。');

t('简式-日记', { type: 'diary', fields: { title: '翁同龢日记', volume: '6', date: '光绪二十三年十月二十三日', organizer: '陈义杰', pubPlace: '北京', publisher: '中华书局', pubYear: '1998', pages: '3058' } }, 'lsyj', { simple: true },
  '《翁同龢日记》第6册，第3058页。');

t('简式-电子文献', { type: 'web', fields: { authors: ['王明亮'], title: '关于中国学术期刊标准化数据库系统工程的进展', url: 'http://www.cajcd.cn/pub/wml.txt/980810-2.html', accessDate: '1998年10月4日' } }, 'lsyj', { simple: true },
  '王明亮：《关于中国学术期刊标准化数据库系统工程的进展》。');

t('简式-日文期刊', { lang: 'ja', type: 'journal', fields: { authors: ['梅津彰人'], title: 'キャンパスの文章—卒業論文', containerTitle: '国文学 解釈と教材の研究', volume: '40', issue: '2', pubYear: '1955', pages: '71—74' } }, 'lsyj', { simple: true },
  '梅津彰人：「キャンパスの文章—卒業論文」、第71—74頁。');

// ================= 间接引文 =================
t('参见', { type: 'book', fields: { seePrefix: '参见', authors: ['邱陵'], authorRole: '编著', title: '书籍装帧艺术简史', pubPlace: '哈尔滨', publisher: '黑龙江人民出版社', pubYear: '1984', pages: '28－29' } }, 'lsyj', {},
  '参见邱陵编著：《书籍装帧艺术简史》，哈尔滨：黑龙江人民出版社，1984年，第28－29页。');

t('详见-章节', { type: 'book', fields: { seePrefix: '详见', authors: ['张树年'], authorRole: '主编', title: '张元济年谱', pubPlace: '北京', publisher: '商务印书馆', pubYear: '1991', pages: '6章' } }, 'lsyj', {},
  '详见张树年主编：《张元济年谱》，北京：商务印书馆，1991年，第6章。');

// ================= 缺失与不确定 =================
missingIn('缺失出版者与时间', { type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', pages: '43' } }, 'lsyj', {}, '出版者');
missingIn('缺失出版者与时间2', { type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', pages: '43' } }, 'lsyj', {}, '出版时间');
missingIn('缺失藏所', { type: 'archive', fields: { title: '傅良佐致国务院电', date: '1917年9月15日', archiveNo: '北洋档案 1011—5961' } }, 'lsyj', {}, '藏所');

(function uncertainTest() {
  const r = R.render(cite({ type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', publisher: '北新书局', pubYear: '1948', pages: '43' }, uncertain: ['pages'] }), 'lsyj', {});
  const found = r.segments.some(s => s.u === true);
  if (found) pass++; else { fail++; failures.push({ name: '不确定字段标记', actual: JSON.stringify(r.segments), expected: 'u=true on pages' }); }
})();

// ================= GB/T 7714-2015 =================
t('国标-专著', { type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', publisher: '北新书局', pubYear: '1948', pages: '43' } }, 'gbt', {},
  '赵景深. 文坛忆旧[M]. 上海: 北新书局, 1948: 43.');

t('国标-主编', { type: 'book', fields: { authors: ['金冲及'], authorRole: '主编', title: '周恩来传', pubPlace: '北京', publisher: '人民出版社', pubYear: '1989', pages: '9' } }, 'gbt', {},
  '金冲及, 主编. 周恩来传[M]. 北京: 人民出版社, 1989: 9.');

t('国标-期刊', { type: 'journal', fields: { authors: ['何龄修'], title: '读顾诚《南明史》', containerTitle: '中国史研究', pubYear: '1998', issue: '3', pages: '42-48' } }, 'gbt', {},
  '何龄修. 读顾诚《南明史》[J]. 中国史研究, 1998(3): 42-48.');

t('国标-报纸', { type: 'newspaper', fields: { authors: ['李眉'], title: '李劼人轶事', containerTitle: '四川工人日报', date: '1986年8月22日', edition: '2' } }, 'gbt', {},
  '李眉. 李劼人轶事[N]. 四川工人日报, 1986-08-22(2).');

t('国标-学位论文', { type: 'thesis', fields: { authors: ['方明东'], title: '罗隆基政治思想研究（1913—1949）', pubPlace: '北京', institution: '北京师范大学历史系', pubYear: '2000' } }, 'gbt', {},
  '方明东. 罗隆基政治思想研究（1913—1949）[D]. 北京: 北京师范大学历史系, 2000.');

t('国标-电子文献', { type: 'web', fields: { authors: ['王明亮'], title: '关于中国学术期刊标准化数据库系统工程的进展', pubYear: '1998', accessDate: '1998年10月4日', url: 'http://www.cajcd.cn/pub/wml.txt/980810-2.html' } }, 'gbt', {},
  '王明亮. 关于中国学术期刊标准化数据库系统工程的进展[EB/OL]. (1998)[1998年10月4日]. http://www.cajcd.cn/pub/wml.txt/980810-2.html.');

t('国标-古籍刻本', { type: 'ancient', sub: 'keben', fields: { authors: ['姚际恒'], title: '古今伪书考', volume: '3', version: '光绪三年苏州文学山房活字本', pages: '9页a' } }, 'gbt', {},
  '姚际恒. 古今伪书考: 卷3[M]. 光绪三年苏州文学山房活字本. : 9页a.');

t('国标-档案', { type: 'archive', fields: { title: '傅良佐致国务院电', archiveNo: '北洋档案 1011—5961', archivePlace: '中国第二历史档案馆', date: '1917年9月15日' } }, 'gbt', {},
  '傅良佐致国务院电[A]. 北洋档案 1011—5961. 中国第二历史档案馆, 1917年9月15日.');

t('国标-英文专著', { lang: 'en', type: 'book', fields: { authors: ['Peter Brooks'], title: 'Troubling Confessions: Speaking Guilt in Law and Literature', titleSc: 'Troubling confessions: Speaking guilt in law and literature', pubPlace: 'Chicago', publisher: 'University of Chicago Press', pubYear: '2000', pages: '48' } }, 'gbt', {},
  'BROOKS P. Troubling confessions: Speaking guilt in law and literature[M]. Chicago: University of Chicago Press, 2000: 48.');

t('国标-析出文献', { type: 'chapter', fields: { authors: ['鲁迅'], title: '中国小说的历史的变迁', containerTitle: '鲁迅全集', volume: '9', volumeUnit: '册', pubPlace: '北京', publisher: '人民文学出版社', pubYear: '1981', pages: '325' } }, 'gbt', {},
  '鲁迅. 中国小说的历史的变迁[M]//鲁迅全集: 第9册. 北京: 人民文学出版社, 1981: 325.');

// ================= APA 7th =================
t('APA-英文专著', { lang: 'en', type: 'book', fields: { authors: ['Peter Brooks'], title: 'Troubling Confessions: Speaking Guilt in Law and Literature', titleSc: 'Troubling confessions: Speaking guilt in law and literature', publisher: 'University of Chicago Press', pubYear: '2000' } }, 'apa', {},
  'Brooks, P. (2000). Troubling confessions: Speaking guilt in law and literature. University of Chicago Press.');

t('APA-中文专著', { type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', publisher: '北新书局', pubYear: '1948' } }, 'apa', {},
  '赵景深. (1948). 文坛忆旧. 北新书局.');

t('APA-英文期刊', { lang: 'en', type: 'journal', fields: { authors: ['Heath B. Chamberlain'], title: 'On the Search for Civil Society in China', titleSc: 'On the search for civil society in China', containerTitle: 'Modern China', volume: '19', issue: '2', pubYear: '1993', pages: '199-215' } }, 'apa', {},
  'Chamberlain, H. B. (1993). On the search for civil society in China. Modern China, 19(2), 199–215.');

t('APA-中文期刊', { type: 'journal', fields: { authors: ['何龄修'], title: '读顾诚《南明史》', containerTitle: '中国史研究', pubYear: '1998', issue: '3', pages: '42-48' } }, 'apa', {},
  '何龄修. (1998). 读顾诚《南明史》. 中国史研究, (3), 42–48.');

t('APA-中文学位论文', { type: 'thesis', fields: { authors: ['方明东'], title: '罗隆基政治思想研究（1913—1949）', degree: '博士', institution: '北京师范大学历史系', pubYear: '2000' } }, 'apa', {},
  '方明东. (2000). 罗隆基政治思想研究（1913—1949）[博士学位论文, 北京师范大学历史系].');

t('APA-中文报纸', { type: 'newspaper', fields: { authors: ['李眉'], title: '李劼人轶事', containerTitle: '四川工人日报', date: '1986年8月22日', edition: '2' } }, 'apa', {},
  '李眉. (1986-08-22). 李劼人轶事. 四川工人日报, 2.');

t('APA-中文电子文献', { type: 'web', fields: { authors: ['王明亮'], title: '关于中国学术期刊标准化数据库系统工程的进展', pubYear: '1998', accessDate: '1998年10月4日', url: 'http://www.cajcd.cn/pub/wml.txt/980810-2.html' } }, 'apa', {},
  '王明亮. (1998). 关于中国学术期刊标准化数据库系统工程的进展. 检索于1998年10月4日, from http://www.cajcd.cn/pub/wml.txt/980810-2.html');

t('APA-古籍点校本', { type: 'ancient', sub: 'dianjiao', fields: { authors: ['毛祥麟'], title: '墨余录', publisher: '上海古籍出版社', pubYear: '1985' } }, 'apa', {},
  '毛祥麟. (1985). 墨余录. 上海古籍出版社.');

// ================= MLA 9th =================
t('MLA-英文专著', { lang: 'en', type: 'book', fields: { authors: ['Peter Brooks'], title: 'Troubling Confessions: Speaking Guilt in Law and Literature', publisher: 'University of Chicago Press', pubYear: '2000' } }, 'mla', {},
  'Brooks, Peter. Troubling Confessions: Speaking Guilt in Law and Literature. University of Chicago Press, 2000.');

t('MLA-中文专著', { type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', publisher: '北新书局', pubYear: '1948' } }, 'mla', {},
  '赵景深. 《文坛忆旧》. 北新书局, 1948年.');

t('MLA-英文期刊', { lang: 'en', type: 'journal', fields: { authors: ['Heath B. Chamberlain'], title: 'On the Search for Civil Society in China', containerTitle: 'Modern China', volume: '19', issue: '2', pubYear: '1993', pages: '199-215' } }, 'mla', {},
  'Chamberlain, Heath B. “On the Search for Civil Society in China.” Modern China, vol. 19, no. 2, 1993, pp. 199–215.');

t('MLA-中文期刊', { type: 'journal', fields: { authors: ['何龄修'], title: '读顾诚〈南明史〉', containerTitle: '中国史研究', pubYear: '1998', issue: '3', pages: '42-48' } }, 'mla', {},
  '何龄修. 《读顾诚〈南明史〉》. 《中国史研究》, 1998年, 第3期, 第42-48页.');

t('MLA-中文报纸', { type: 'newspaper', fields: { authors: ['李眉'], title: '李劼人轶事', containerTitle: '四川工人日报', date: '1986年8月22日', edition: '2' } }, 'mla', {},
  '李眉. 《李劼人轶事》. 《四川工人日报》, 1986年8月22日, 第2版.');

t('MLA-中文学位论文', { type: 'thesis', fields: { authors: ['方明东'], title: '罗隆基政治思想研究（1913—1949）', degree: '博士', institution: '北京师范大学历史系', pubYear: '2000' } }, 'mla', {},
  '方明东. 《罗隆基政治思想研究（1913—1949）》. 博士学位论文, 北京师范大学历史系, 2000年.');

t('MLA-中文电子文献', { type: 'web', fields: { authors: ['王明亮'], title: '关于中国学术期刊标准化数据库系统工程的进展', pubYear: '1998', url: 'http://www.cajcd.cn/pub/wml.txt/980810-2.html', accessDate: '1998年10月4日' } }, 'mla', {},
  '王明亮. 《关于中国学术期刊标准化数据库系统工程的进展》. 1998, http://www.cajcd.cn/pub/wml.txt/980810-2.html. 访问于1998年10月4日.');

// ================= 重复检测 =================
(function dupTest() {
  const c1 = { lang: 'zh', type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', publisher: '北新书局', pubYear: '1948', pages: '43' } };
  const c2 = JSON.parse(JSON.stringify(c1));
  const c3 = { lang: 'zh', type: 'book', fields: { authors: ['鲁迅'], title: '呐喊' } };
  const marked = R.markDuplicates([c1, c3, c2]);
  if (marked[2].duplicateOf === 0) pass++;
  else { fail++; failures.push({ name: '重复检测', actual: String(marked[2].duplicateOf), expected: '0' }); }
})();

// ================= 其他语种提醒 =================
(function otherLangTest() {
  const r = R.render(cite({ lang: 'fr', type: 'book', fields: { authors: ['Marc Bloch'], title: 'La Société féodale', pubPlace: 'Paris', publisher: 'Albin Michel', pubYear: '1939', pages: '12' } }), 'lsyj', {});
  if (r.notes.length > 0 && r.notes[0].indexOf('人工核对') >= 0) pass++;
  else { fail++; failures.push({ name: '其他语种提醒', actual: JSON.stringify(r.notes), expected: 'note with 人工核对' }); }
})();

(function apaAncientNoteTest() {
  const r = R.render(cite({ type: 'ancient', sub: 'keben', fields: { authors: ['姚际恒'], title: '古今伪书考', version: '刻本' } }), 'apa', {});
  if (r.notes.length > 0 && r.notes[0].indexOf('人工核对') >= 0) pass++;
  else { fail++; failures.push({ name: 'APA古籍提醒', actual: JSON.stringify(r.notes), expected: 'note with 人工核对' }); }
})();

// ================= 防幻觉过滤 =================
(function filterTests() {
  const L = require('../renderer/llm.js');
  const input = '赵景深. 文坛忆旧[M]. 上海: 北新书局, 1948: 43.\nHeath B. Chamberlain, "On the Search for Civil Society in China," Modern China, Vol. 19, No. 2, 1993, pp. 199-215.';
  const real1 = { lang: 'zh', type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubPlace: '上海', publisher: '北新书局', pubYear: '1948', pages: '43' } };
  const real2 = { lang: 'en', type: 'journal', fields: { authors: ['Heath B. Chamberlain'], title: 'On the Search for Civil Society in China', containerTitle: 'Modern China' } };
  const ghost = { lang: 'zh', type: 'ancient', fields: { authors: ['姚际恒'], title: '古今伪书考', volume: '3', version: '光绪三年苏州文学山房活字本' } };
  const ghost2 = { lang: 'zh', type: 'archive', fields: { title: '傅良佐致国务院电', archiveNo: '北洋档案 1011—5961' } };

  var r1 = L.filterUnrelated([real1, ghost, ghost2], input);
  eq('过滤-保留真实条目', r1.citations.length, 1);
  eq('过滤-计数无关条目', r1.removed, 2);

  var r2 = L.filterUnrelated([ghost, ghost2], input);
  eq('过滤-全幻觉返回空', r2.citations.length, 0);

  var typo = { lang: 'zh', type: 'book', fields: { authors: ['赵景深'], title: '文坛亿旧', pubPlace: '上海', publisher: '北新书局', pubYear: '1948', pages: '43' } };
  var r3 = L.filterUnrelated([typo], input);
  eq('过滤-容忍笔误', r3.citations.length, 1);

  var r4 = L.filterUnrelated([real2], input);
  eq('过滤-英文标题匹配', r4.citations.length, 1);
})();

// ================= 文内引用 =================
(function inTextTests() {
  var it1 = R.renderInText(cite({ type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubYear: '1948', pages: '43' } }), 'apa');
  eq('APA文内-括注式', it1.paren, '（赵景深，1948，第43页）');
  eq('APA文内-叙述式', it1.narrative, '赵景深（1948，第43页）');

  var it2 = R.renderInText(cite({ lang: 'en', type: 'book', fields: { authors: ['Randolph Starn', 'Loren Partridge'], title: 'The Arts of Power', pubYear: '1992', pages: '19-28' } }), 'apa');
  eq('APA文内-英文两作者', it2.paren, '(Starn & Partridge, 1992, pp. 19–28)');
  eq('APA文内-英文叙述', it2.narrative, 'Starn and Partridge (1992, pp. 19–28)');

  var it3 = R.renderInText(cite({ lang: 'en', type: 'book', fields: { authors: ['Julie Evans', 'A', 'B', 'C'], title: 'X', pubYear: '2003' } }), 'apa');
  eq('APA文内-et al.', it3.paren, '(Evans et al., 2003)');

  var it4 = R.renderInText(cite({ type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pubYear: '1948', pages: '43' } }), 'mla');
  eq('MLA文内-括注式', it4.paren, '（赵景深 43）');
  eq('MLA文内-叙述式', it4.narrative, '赵景深（43）');

  var it5 = R.renderInText(cite({ lang: 'en', type: 'book', fields: { authors: ['Peter Brooks'], title: 'T', pubYear: '2000', pages: '48' } }), 'mla');
  eq('MLA文内-英文', it5.paren, '(Brooks 48)');

  var it6 = R.renderInText(cite({ type: 'book', fields: { authors: ['赵景深', '钱锺书'], title: 'X', pubYear: '1948' } }), 'gbt');
  eq('国标文内-著者出版年', it6.authYear, '（赵景深、钱锺书，1948）');

  var it7 = R.renderInText(cite({ lang: 'en', type: 'book', fields: { authors: ['Peter Brooks'], title: 'T', pubYear: '2000' } }), 'gbt');
  eq('国标文内-英文著者出版年', it7.authYear, '(BROOKS, 2000)');

  var it8 = R.renderInText(cite({ type: 'ancient', sub: 'classic', fields: { title: '旧唐书', pubYear: '1975' } }), 'apa');
  eq('APA文内-无作者题名回退', it8.paren, '（《旧唐书》，1975）');

  var it9 = R.renderInText(cite({ type: 'book', fields: { authors: ['赵景深'], title: '文坛忆旧', pages: '43' } }), 'apa');
  eq('APA文内-缺年份', it9.paren, '（赵景深，第43页）');
})();

console.log('通过: ' + pass + '  失败: ' + fail);
if (failures.length) {
  console.log('\n===== 失败明细 =====');
  failures.forEach(function (x) {
    console.log('\n[' + x.name + ']');
    console.log('  期望: ' + x.expected);
    console.log('  实际: ' + x.actual);
  });
  process.exit(1);
} else {
  console.log('全部通过 ✔');
}

