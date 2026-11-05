import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'mockups', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // scrollable content (wide equations) must be keyboard-focusable; a labelled group is the right role
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'group'] }],
    },
  },
  // Layer boundaries: physics is pure; shared layers never reach into experiments.
  {
    files: ['src/physics/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['react', 'react-*', '**/engine/**', '**/ui/**', '**/experiments/**', '**/app/**'] }],
    },
  },
  {
    files: ['src/engine/**', 'src/ui/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['**/experiments/**', '**/app/**'] }] },
  },
);
