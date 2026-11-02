# 引注格式转换器

> Citation Format Converter — turn messy bibliographic references into properly formatted citations for Chinese historical scholarship and international journals.

把 APA、MLA、GB/T 7714、《历史研究》、知网导出、百度学术，甚至随手写下的一句文献描述，转换成符合目标刊物要求的引注格式。专为中国史研究者的写作场景设计，同时支持英文与日文文献。

![界面截图](docs/screenshot.png)

## 功能

- **四种输出格式**：《历史研究》注释体例、GB/T 7714-2015、APA 7th、MLA 9th。
- **任意格式输入**：由 LLM 识别并拆分一条或多条引注，不要求输入格式统一。
- **结构化字段抽取**：作者、题名、刊名、出版地、出版者、年份、卷期、页码、版本、藏所等。
- **缺失与不确定提示**：缺失字段以 `【缺：字段】` 标出，拿不准的字段以「请核对」高亮，避免把猜测当成定稿。
- **防幻觉过滤**：AI 返回的每条引注都必须能在原文中找到题名、作者或刊名依据，否则自动丢弃。
- **接口失败兜底**：API 不可用时，用内置正则解析常见单行引注，结果会明确标注「本地兜底」。
- **重复文献检测**：GB/T 7714 顺序编码制下，重复文献复用同一编号。
- **《历史研究》专用细节**：期刊文章区分「引用文章」与「引用观点」两种脚注，另提供再次引用简式。
- **多语种**：中文、英文、日文分别按对应语种规则渲染；其他语种按英文规则处理并提示人工核对。
- **一键复制**：单条复制或复制全部主要条目；输入内容与所选格式自动记忆。

## 支持范围

### 输出格式

| 格式 | 生成内容 |
| --- | --- |
| 《历史研究》 | 完整脚注、再次引用简式；中文期刊区分是否带页码 |
| GB/T 7714-2015 | 参考文献条目、顺序编码制文内标注、著者-出版年制文内引用 |
| APA 7th | 参考文献条目、括注式与叙述式文内引用 |
| MLA 9th | 文献列表条目、括注式与叙述式文内引用 |

### 文献类型

著作、析出文献、序言、期刊文章、报纸文章、学位论文、会议论文、档案文献、日记、转引文献、电子文献，以及古籍的七个子类：刻本、点校本、影印本、析出、地方志、常用典籍、编年体典籍。

## 快速开始

需要 Node.js 20 或更高版本。

```bash
npm install
npm start
```

首次使用请点击右上角「⚙ 设置」，填写接口地址、模型名称和 API Key。应用内置以下预设：

| 预设 | baseURL | 默认模型 |
| --- | --- | --- |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-v4-flash` |
| Kimi (Moonshot) | `https://api.moonshot.cn/v1` | `kimi-latest` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |

模型名称可自行修改。部分接口不支持 `response_format: json_object`，可在设置中关闭「请求 JSON 输出模式」。

## 使用

1. 在左侧粘贴一条或多条引注，支持混贴不同来源格式，也支持自由文本描述。
2. 按 `Ctrl+Enter` 或点击「转换」。
3. 在顶部切换目标格式，右侧会同时给出完整条目、文内引用与简式。
4. 缺失信息会在条目下方汇总，按提示补全后重新转换即可。

## 打包

```bash
npm run dist
```

使用 electron-builder 生成 Windows 便携版，产物位于 `dist/`。打包配置见 `package.json` 的 `build` 字段。

## 工作原理

```
输入文本
  → renderer/llm.js     LLM 抽取为结构化 JSON（类型、语种、字段、缺失/不确定）
  → 字段规范化          丢弃未知字段，校验类型与语种枚举
  → 防幻觉过滤          题名/作者/刊名必须在原文中有依据
  → renderer/rules.js   按目标格式逐字段渲染，标记缺失与不确定
  → 界面                分条展示、汇总缺失、复制
```

接口调用失败或返回无法解析时，`fallbackParse` 会用正则尝试识别常见的《历史研究》、GB/T、APA、MLA 单行著录。

## 项目结构

```
main.js                 Electron 主进程：窗口、设置读写、LLM 请求代理
preload.js              contextBridge，向渲染进程暴露受限接口
renderer/
  index.html            界面结构
  style.css             样式
  app.js                交互、设置面板、结果渲染与复制
  llm.js                提示词、JSON 解析、字段规范化、防幻觉过滤、正则兜底
  rules.js              四种格式的渲染规则与文内引用
test/
  run-tests.js          116 项格式规则测试（无需安装依赖即可运行）
  api-test.js           真实接口联调脚本，需要 DEEPSEEK_KEY 环境变量
.github/workflows/      持续集成
```

## 测试

```bash
npm test
```

测试只依赖 `renderer/rules.js` 与 `renderer/llm.js`，不需要启动 Electron。当前覆盖 116 项断言，包括四种格式、古籍各子类、缺失字段、文内引用、重复检测与过滤逻辑。

真实接口联调：

```bash
DEEPSEEK_KEY=sk-... node test/api-test.js
```

## 隐私与安全

- 输入的引注文本会发送到你在设置中配置的 LLM 接口，请勿粘贴敏感内容。
- API Key 仅保存在本机设置文件中，不会上传到本项目的任何服务器；但它是**明文存储**的。开发模式位于 Electron 的 `userData` 目录，打包后的便携版优先使用 exe 同目录的 `settings.json`（目录不可写时回退到 `userData`）。
- 仓库与发行包不包含任何 API Key。请勿把带有个人 Key 的 `settings.json` 提交到版本库或分享给他人。
- 渲染进程启用了 `contextIsolation`、关闭了 `nodeIntegration`，网络请求统一由主进程代理。

## 已知限制

- 规则覆盖的是常见著录情形，不能替代刊物编辑规范；特殊文献仍可能需人工调整。
- APA / MLA 对中文古籍、档案、日记等类型没有官方专条，程序按通行惯例转换并给出「请人工核对」提示。
- 自由文本的识别质量取决于所选模型；正则兜底只覆盖少数常见单行格式。
- 目前打包目标仅为 Windows 便携版，其他平台可自行调整 electron-builder 配置。

## 许可证

[MIT](LICENSE)
