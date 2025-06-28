# OpenAPI Desktop

一个基于 Electron 的 OpenAPI 规范查看器，使用 React 和 TypeScript 构建。

## 功能特点

- 📝 支持导入并查看 OpenAPI/Swagger 规范文件
- 💾 本地项目管理
- 🖥️ 跨平台支持 (Windows, macOS, Linux)
- ⚡ 基于 Electron 的原生桌面体验

## 推荐的开发环境

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 项目设置

### 安装依赖

```bash
$ pnpm install
```

### 开发模式

```bash
$ pnpm dev
```

### 构建应用

```bash
# Windows 版本
$ pnpm build:win

# macOS 版本
$ pnpm build:mac

# Linux 版本
$ pnpm build:linux
```

## 技术栈

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript 超集
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
