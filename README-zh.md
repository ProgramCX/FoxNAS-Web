# FoxNAS Web 管理界面

<p align="center"><img src="./public/favicon.ico" width="100" height="100"></p>
<h1 align="center">FoxNAS Web 管理界面</h1>

<div align="center">

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=round-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=round-square&logo=typescript)](https://www.typescriptlang.org/)
[![Naive UI](https://img.shields.io/badge/Naive-UI-2?style=round-square)](#)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=round-square&logo=vite)](https://vitejs.dev/)

</div>

>

[English](README.md) | [中文](README-zh.md)

FoxNAS Web 管理界面是一个基于现代 Web 技术构建的 NAS 管理界面，使用 **Vue 3**、**TypeScript** 和 **Naive UI** 开发。它提供了一个响应式、用户友好的界面，用于管理 FoxNAS 服务器，功能涵盖文件管理、用户管理、DDNS 配置和系统监控。

## 功能特性

- **响应式设计**  
  针对桌面和移动设备进行了优化，确保在所有屏幕尺寸上都能获得流畅的体验。

- **文件管理**  
  完整的文件浏览器，支持上传、下载、创建文件夹、重命名、移动、复制和删除操作。支持拖拽上传和文件夹上传。

- **用户管理**  
  全面的用户管理功能，包括用户创建、编辑、删除、角色管理和权限配置。

- **DDNS 配置**  
  配置和管理动态 DNS 设置，支持多种 DNS 服务商，包括腾讯云和阿里云。

- **系统仪表盘**  
  实时监控系统状态，包括 CPU 使用率、内存使用率、磁盘使用率和网络流量，并提供交互式图表。

- **多语言支持**  
  内置国际化支持，包括英语、简体中文、繁体中文、法语、德语、日语、阿拉伯语、葡萄牙语和俄语。

- **主题自定义**  
  多种颜色主题，支持浅色和深色模式。

- **媒体播放器**  
  集成媒体播放器，可直接从 NAS 流式传输音频和视频文件。

- **日志管理**  
  查看和管理系统错误日志，支持筛选和搜索功能。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **UI组件库**: Naive UI
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **图表**: ECharts / vue-echarts
- **国际化**: vue-i18n
- **构建工具**: Vite
- **图标**: Ionicons 5

## 项目结构

```
FoxNAS-Web/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 服务模块
│   │   └── services/      # API 服务定义
│   ├── assets/            # 模块资源
│   ├── components/        # 可复用 Vue 组件
│   │   └── Layout/        # 布局组件
│   ├── composables/       # Vue 组合式函数
│   ├── i18n/              # 国际化配置
│   │   └── locales/       # 语言文件
│   ├── router/            # Vue Router 配置
│   ├── stores/            # Pinia 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── views/             # 页面组件
│   ├── App.vue            # 根组件
│   └── main.ts            # 应用入口
├── index.html             # HTML 模板
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript 配置
└── vite.config.ts         # Vite 配置
```

## 快速开始

### 前置条件

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
# 安装依赖
npm install

# 或使用 pnpm
pnpm install

# 或使用 yarn
yarn install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://你的服务器API地址
```

## API 对接

FoxNAS Web 旨在与 [FoxNAS Server](https://github.com/ProgramCX/FoxNAServer) 配合使用。请确保服务器正在运行并正确配置后再使用 Web 界面。

## 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

本项目基于 [MIT](LICENSE) 开源。

---

<p align="center">
由 FoxNAS 团队 ❤️ 开发
</p>
