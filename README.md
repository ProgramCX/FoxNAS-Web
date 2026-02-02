# FoxNAS Web Management

<p align="center"><img src="./public/favicon.ico" width="100" height="100"></p>
<h1 align="center">FoxNAS Web Management</h1>

<div align="center">

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=round-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=round-square&logo=typescript)](https://www.typescriptlang.org/)
[![Naive UI](https://img.shields.io/badge/Naive-UI-2?style=round-square)](#)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=round-square&logo=vite)](https://vitejs.dev/)

</div>

>

[English](README.md) | [中文](README-zh.md)

FoxNAS Web Management is a modern web-based NAS administration interface developed with **Vue 3**, **TypeScript**, and **Naive UI**. It provides a responsive and user-friendly interface for managing FoxNAS servers, featuring file management, user management, DDNS configuration, and system monitoring capabilities.

## Features

- **Responsive Design**  
  Optimized for both desktop and mobile devices, ensuring a seamless experience across all screen sizes.

- **File Management**  
  Complete file browser with support for upload, download, create folders, rename, move, copy, and delete operations. Supports drag-and-drop upload and folder upload.

- **User Management**  
  Comprehensive user administration including user creation, editing, deletion, role management, and permission configuration.

- **DDNS Configuration**  
  Configure and manage Dynamic DNS settings with support for multiple DNS providers including Tencent Cloud and Alibaba Cloud.

- **System Dashboard**  
  Real-time monitoring of system status including CPU usage, memory usage, disk usage, and network traffic with interactive charts.

- **Multi-Language Support**  
  Built-in internationalization supporting English, Simplified Chinese, Traditional Chinese, French, German, Japanese, Arabic, Portuguese, and Russian.

- **Theme Customization**  
  Multiple color themes with light and dark mode support.

- **Media Player**  
  Integrated media player for streaming audio and video files directly from the NAS.

- **Log Management**  
  View and manage system error logs with filtering and search capabilities.

## Tech Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **UI Component Library**: Naive UI
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Charts**: ECharts / vue-echarts
- **Internationalization**: vue-i18n
- **Build Tool**: Vite
- **Icons**: Ionicons 5

## Project Structure

```
FoxNAS-Web/
├── public/                 # Static assets
├── src/
│   ├── api/               # API service modules
│   │   └── services/      # API service definitions
│   ├── assets/            # Module assets
│   ├── components/        # Reusable Vue components
│   │   └── Layout/        # Layout components
│   ├── composables/       # Vue composables
│   ├── i18n/              # Internationalization
│   │   └── locales/       # Language files
│   ├── router/            # Vue Router configuration
│   ├── stores/            # Pinia stores
│   ├── types/             # TypeScript type definitions
│   ├── views/             # Page components
│   ├── App.vue            # Root component
│   └── main.ts            # Application entry point
├── index.html             # HTML template
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm

### Installation

```bash
# Install dependencies
npm install

# Or using pnpm
pnpm install

# Or using yarn
yarn install
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://your-server-api-url
```

## API Integration

FoxNAS Web is designed to work with [FoxNAS Server](https://github.com/ProgramCX/FoxNAServer). Ensure the server is running and configured properly before using the web interface.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [GPL 3.0 License](LICENSE).

---

<p align="center">
Developed with ❤️ by FoxNAS Team
</p>
