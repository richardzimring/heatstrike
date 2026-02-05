import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // Global ignores
  globalIgnores([
    'coverage/**/*',
    'dist/**/*',
    '.serverless/**/*',
    'src/**/fixtures/**/*',
    'node_modules/**/*',
    'eslint.config.js'
  ]),
  
  // Base configurations
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  
  // Main rules for JS/TS files
  {
    files: ['**/*.js', '**/*.ts'],
    rules: {
      'no-magic-numbers': 'off',
    }
  },
  
  // Test-specific rules
  {
    files: ['src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/init-declarations': 'off',
    }
  }
]);