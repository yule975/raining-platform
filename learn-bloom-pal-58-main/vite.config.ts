import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];
  
  // 只在开发环境中加载 lovable-tagger
  if (mode === 'development') {
    try {
      const { componentTagger } = require('lovable-tagger');
      plugins.push(componentTagger());
    } catch (e) {
      // 在生产环境或者包不可用时忽略
      console.warn('lovable-tagger not available, skipping...');
    }
  }

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      open: true,
    },
    preview: {
      host: "0.0.0.0",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    appType: 'spa', // 确保SPA模式
  };
});
