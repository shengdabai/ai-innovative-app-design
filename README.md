# AI Innovative App Design 💡

[![Last commit](https://img.shields.io/github/last-commit/shengdabai/ai-innovative-app-design)](https://github.com/shengdabai/ai-innovative-app-design/commits)
[![Stars](https://img.shields.io/github/stars/shengdabai/ai-innovative-app-design?style=social)](https://github.com/shengdabai/ai-innovative-app-design/stargazers)
[![Follow @shengdabai](https://img.shields.io/github/followers/shengdabai?style=social)](https://github.com/shengdabai)

**English | [中文](#中文)**

> Three AI product concepts, each backed by a real, runnable prototype — fashion try-on, a personal health coach, and a need-first shopping guide. Building in public.

## Why this repo exists

I'm a full-time Chinese-language teacher (6,000+ students) who builds AI tools in public. This repo is my sandbox for **AI-native product ideas**: instead of stopping at slides, each concept ships with a working full-stack skeleton you can clone, read, and run. It's where a design doc and a prototype live side by side, so the idea and the code keep each other honest.

## What's inside

This is **not** a finished product or a published app store release. It's a set of **concept-stage prototypes** — each one pairs a product/technical design with a working code skeleton (real backends, real frontends, mock AI services where keys aren't wired up yet). Treat it as reference architecture and idea fuel, not production software.

## ✨ Concepts

| App | The idea | What's built | Stack |
| --- | --- | --- | --- |
| 👗 **AI Outfit Assistant** (`AI情绪运动教练/ai-outfit-assistant`) | Virtual try-on + outfit suggestions powered by AIGC | Next.js 16 frontend + FastAPI backend with auth & a mock try-on service | Next.js 16, React 19, Tailwind 4, FastAPI |
| 🏃 **AI Smart Fitness Coach** (`AI运动健康`) | Private-coach-grade health management: diet monitoring → smart menus → data loop | Most complete app — NestJS backend (auth, diet, menu, analytics, chat, achievements), Expo RN app, Prisma schema, Docker Compose, API & deploy docs | NestJS, Prisma, PostgreSQL, Redis, Expo/React Native |
| 🛒 **AI Need-First Shopping Guide** (`AI需求购物导购`) | "Need-first, not product-first" — multi-turn dialogue to surface the real need before recommending anything | Detailed tech-design doc + FastAPI need-analysis & product-matching services + HTML frontend | FastAPI, Python, HTML |

> Heads-up on naming: the `AI情绪运动教练` folder currently holds the **outfit / try-on** app — the directory label is legacy and being tidied up.

## 🧱 Format & tech

- **Code**: TypeScript / JavaScript (NestJS, Next.js, Expo) and Python (FastAPI).
- **AI integration points**: GPT-style dialogue, image recognition, recommendation scoring — wired as real service boundaries with mock implementations where API keys aren't included.
- **Docs**: each concept ships its own README; the shopping guide includes architecture diagrams, a 5-stage interaction flow, scoring formulas, and data models.

## 🚀 How to read / use the docs

1. Pick a concept folder above and open its `README.md` for the product thinking.
2. For the **Fitness Coach**, see `AI运动健康/docs/` for `API.md` and `DEPLOYMENT.md`.
3. To run a prototype, follow the per-app quick-start (e.g. `npm run start:dev` for the NestJS backend, `next dev` for the Next.js frontend, `uvicorn` for the FastAPI services). Provide your own AI API keys to swap mocks for live calls.

## 🗺️ Status

**Concept stage.** These are prototypes and design docs, not shipped products. The Fitness Coach is the most fleshed-out; the Shopping Guide is design-doc-led with working core services; the Outfit Assistant is an early scaffold. Expect rough edges, mock services, and active iteration.

## 🤝 Connect / About

Built by **Tony (Sheng)** — a Chinese teacher turning teaching and product ideas into AI tools, in public.

If any of these concepts spark something, **⭐ Star this repo and [Follow @shengdabai](https://github.com/shengdabai)** to follow along as they evolve.

Related work you might like:
- [chinese-learning-app](https://github.com/shengdabai/chinese-learning-app) — LinguaLens: AI Chinese tutor, snap a photo to learn words.
- [smart-recipe-recommender](https://github.com/shengdabai/smart-recipe-recommender) — tell it what's in your fridge, get an AI-planned daily menu.
- [Tony-Claude-Code-Skills](https://github.com/shengdabai/Tony-Claude-Code-Skills) — 320+ curated Claude Code skills, agents & commands.

## License

MIT.

---

<a name="中文"></a>

# AI 创新应用设计 💡

**[English](#ai-innovative-app-design-) | 中文**

> 三个 AI 产品概念，每个都配有真实可运行的原型——虚拟试穿、个人健康教练、需求优先购物向导。在公开中构建。

## 为什么有这个仓库

我是一名全职中文老师（6000+ 学员），习惯在公开场合构建 AI 工具。这个仓库是我打磨 **AI 原生产品想法** 的试验田：不止步于 PPT，每个概念都附带一套可克隆、可阅读、可运行的全栈骨架。设计文档与原型并排存在，让想法和代码互相校验。

## 这里有什么

这 **不是** 已完成的产品或上线应用，而是一组 **概念阶段的原型**——每个都把产品/技术设计与可运行的代码骨架配对（真实的后端、真实的前端，未接入密钥处用 mock AI 服务）。请把它当作参考架构和灵感来源，而非生产级软件。

## ✨ 概念清单

| 应用 | 核心想法 | 已实现 | 技术栈 |
| --- | --- | --- | --- |
| 👗 **AI 试穿助手** (`AI情绪运动教练/ai-outfit-assistant`) | AIGC 驱动的虚拟试穿 + 穿搭建议 | Next.js 16 前端 + FastAPI 后端（含鉴权与 mock 试穿服务） | Next.js 16, React 19, Tailwind 4, FastAPI |
| 🏃 **AI 智能私教** (`AI运动健康`) | 私教级健康管理：饮食监管 → 智能菜单 → 数据闭环 | 最完整——NestJS 后端（鉴权/饮食/菜单/分析/对话/成就）、Expo RN 应用、Prisma Schema、Docker Compose、API 与部署文档 | NestJS, Prisma, PostgreSQL, Redis, Expo/React Native |
| 🛒 **AI 需求优先购物向导** (`AI需求购物导购`) | "需求优先，而非商品优先"——多轮对话先挖出真实需求，再推荐 | 详细技术方案文档 + FastAPI 需求分析与商品匹配服务 + HTML 前端 | FastAPI, Python, HTML |

> 命名说明：`AI情绪运动教练` 目录当前装的其实是 **试穿 / outfit** 应用——目录名是历史遗留，正在整理。

## 🧱 形态与技术

- **代码**：TypeScript / JavaScript（NestJS、Next.js、Expo）与 Python（FastAPI）。
- **AI 集成点**：GPT 式对话、图像识别、推荐打分——以真实服务边界接入，未含密钥处用 mock 实现。
- **文档**：每个概念都有独立 README；购物向导附带架构图、五阶段交互流程、打分公式和数据模型。

## 🚀 如何阅读 / 使用文档

1. 选上面任一概念文件夹，打开其 `README.md` 看产品思路。
2. **智能私教** 的接口与部署见 `AI运动健康/docs/` 下的 `API.md` 与 `DEPLOYMENT.md`。
3. 运行原型请按各应用的快速开始（如 NestJS 后端 `npm run start:dev`、Next.js 前端 `next dev`、FastAPI 服务用 `uvicorn`）。提供你自己的 AI API 密钥即可把 mock 换成实际调用。

## 🗺️ 状态

**概念阶段。** 这些是原型与设计文档，不是已上线产品。智能私教最完整；购物向导以设计文档为主、核心服务可跑；试穿助手是早期脚手架。请预期有粗糙之处、mock 服务和持续迭代。

## 🤝 联系 / 关于

由 **Tony（盛）** 构建——一名把教学与产品想法变成 AI 工具的中文老师，全程公开。

如果这些概念给了你启发，欢迎 **⭐ Star 本仓库并 [关注 @shengdabai](https://github.com/shengdabai)**，跟进它们的演进。

你可能也会喜欢：
- [chinese-learning-app](https://github.com/shengdabai/chinese-learning-app) —— LinguaLens：AI 中文助教，拍照即学词。
- [smart-recipe-recommender](https://github.com/shengdabai/smart-recipe-recommender) —— 报上冰箱里有什么，给你 AI 规划的每日菜单。
- [Tony-Claude-Code-Skills](https://github.com/shengdabai/Tony-Claude-Code-Skills) —— 320+ 精选 Claude Code skills、agents 与命令。

## 许可证

MIT。
