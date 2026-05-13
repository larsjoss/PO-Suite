import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const sharedRules = {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/consistent-type-imports': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'error',
  'no-var': 'error',
};

// Greift nur auf Root-Ebene; apps/ wird ignoriert — jede App hat eigenen Config
export default tseslint.config(
  { ignores: ['apps/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx}'], rules: sharedRules }
);
