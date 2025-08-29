# OneZygo AI - Professional Development Platform

A modern, AI-powered development platform that helps you build, code, and deploy applications with natural language assistance.

## 🚀 Features

- **AI-Powered Development**: Chat with AI to build features, fix bugs, and optimize code
- **Real-time Code Editing**: Live code editing with syntax highlighting and auto-completion
- **File Management**: Intuitive file explorer with drag-and-drop support
- **Terminal Integration**: Built-in terminal for running commands and managing dependencies
- **Project Scaffolding**: Generate complete projects from natural language descriptions
- **Live Preview**: Real-time preview of your application as you build
- **Professional UI**: Modern, responsive interface designed for productivity

## 📁 Professional Project Structure

```
├── public/                   # Static assets served by web server
│   ├── favicon.ico          # Browser favicon
│   ├── logo.svg             # App logo (SVG)
│   ├── logo.png             # App logo (PNG)
│   ├── manifest.json        # Web app manifest
│   └── robots.txt           # SEO instructions
├── src/
│   ├── icons/               # All icon components (32 files)
│   ├── chat/                # Chat functionality components
│   ├── components/          # Main layout components only
│   │   ├── Header.tsx       # Main header
│   │   ├── Footer.tsx       # Main footer
│   │   └── index.ts         # Component exports
│   ├── editor/              # Code editor components
│   ├── file-explorer/       # File management components
│   ├── hooks/               # Custom React hooks
│   │   ├── useAppState.ts   # Main app state management
│   │   ├── useProjectHandlers.ts # Project-related handlers
│   │   ├── useChatHandlers.ts # Chat-related handlers
│   │   ├── useProjectState.ts # Project state management
│   │   └── useWebContainer.ts # Web container functionality
│   ├── layout/              # Layout components
│   ├── modals/              # Modal dialog components
│   ├── pages/               # Page components
│   ├── services/            # API integrations
│   ├── styles/              # CSS and styling files
│   ├── terminal/            # Terminal components
│   ├── types/               # TypeScript definitions
│   ├── ui/                  # Reusable UI components
│   ├── utils/               # Utility functions
│   │   └── fileUtils.ts     # File processing utilities
│   └── App.tsx              # Main application (simplified)
├── index.html               # Main HTML file
├── package.json             # Dependencies and scripts
└── README.md                # Project documentation
```

## 🏗️ Architecture Overview

### **Modular Design**
The application follows a **professional modular architecture** with clear separation of concerns:

#### **1. Custom Hooks (`src/hooks/`)**
- **`useAppState.ts`** - Main application state management
- **`useProjectHandlers.ts`** - Project upload, download, and scaffolding logic
- **`useChatHandlers.ts`** - AI chat and streaming functionality
- **`useProjectState.ts`** - Project state and file management
- **`useWebContainer.ts`** - Web container integration

#### **2. Utility Functions (`src/utils/`)**
- **`fileUtils.ts`** - File processing, base64 conversion, and type effects

#### **3. Component Organization**
- **`src/components/`** - Header and Footer only
- **`src/icons/`** - All icon components (32 files)
- **`src/AiComponents/`** - All AI-related components
  - **`src/AiComponents/chat/`** - Chat interface components
  - **`src/AiComponents/editor/`** - Code editing components
  - **`src/AiComponents/file-explorer/`** - File management components
  - **`src/AiComponents/layout/`** - Layout and navigation components
  - **`src/AiComponents/modals/`** - Modal dialog components
  - **`src/AiComponents/terminal/`** - Terminal interface components
  - **`src/AiComponents/ui/`** - Reusable UI components
- **`src/pages/`** - Page components
  - **`HomePage.tsx`** - Home page component
  - **`AiPage.tsx`** - AI workspace page component
  - **`AboutUs.tsx`** - About us page
  - **`ContactUs.tsx`** - Contact us page
  - **`PrivacyPolicy.tsx`** - Privacy policy page
  - **`Recommended.tsx`** - Recommended page

### **Benefits of Modular Structure**

#### **1. Maintainability**
- **Separated concerns** - Each hook handles specific functionality
- **Easy debugging** - Issues can be isolated to specific modules
- **Clean imports** - No circular dependencies

#### **2. Scalability**
- **Easy to extend** - New features can be added as separate hooks
- **Reusable logic** - Hooks can be shared across components
- **Testable code** - Each module can be tested independently

#### **3. Developer Experience**
- **Clear organization** - Easy to find specific functionality
- **Reduced complexity** - App.tsx is now much simpler (300 lines vs 1368 lines)
- **Better performance** - Optimized re-renders and state updates

## 🛠️ Setup & Installation

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Modern browser with ES2020 support

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd onezygo-ai

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### **Environment Setup**
1. **API Key Configuration**: Set up your Gemini API key through the app interface
2. **Browser Permissions**: Allow file system access for project uploads
3. **WebContainer**: Ensure your browser supports WebContainer (Chrome/Edge recommended)

## 🎯 Key Features

### **AI-Powered Development**
- **Natural Language Coding**: Describe features in plain English
- **Real-time Streaming**: Watch AI write code in real-time
- **Error Fixing**: AI automatically detects and fixes errors
- **Code Optimization**: Get suggestions for better code structure

### **Professional Workspace**
- **Resizable Panels**: Customize your workspace layout
- **File Explorer**: Browse and manage project files
- **Code Editor**: Full-featured editor with syntax highlighting
- **Terminal**: Run commands and manage dependencies

### **Project Management**
- **Project Upload**: Drag-and-drop folder uploads
- **Project Scaffolding**: Generate complete projects from descriptions
- **Download Projects**: Export your work as ZIP files
- **Version Control**: Track changes and revert when needed

## 🔧 Development

### **Adding New Features**
1. **Create new hook** in `src/hooks/` for business logic
2. **Add components** in appropriate folders
3. **Update types** in `src/types/` if needed
4. **Test thoroughly** before deployment

### **Code Style**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **React Hooks** for state management

### **Performance**
- **Lazy loading** for large components
- **Memoization** for expensive operations
- **Optimized re-renders** with proper dependency arrays

## 📱 Browser Support

- **Chrome 90+** (Recommended)
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ using React, TypeScript, and AI**
