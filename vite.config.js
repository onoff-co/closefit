import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 base:process.env.CLOSEFIT_BASE_PATH||'/',
 plugins:[react()],
 server:{host:'127.0.0.1',port:5173,strictPort:true},
 preview:{host:'127.0.0.1',port:4173,strictPort:true},
 build:{outDir:'dist/client',emptyOutDir:true},
 test:{environment:'jsdom',setupFiles:['./tests/react/setup.js'],include:['tests/react/**/*.test.{js,jsx}'],clearMocks:true}
});
