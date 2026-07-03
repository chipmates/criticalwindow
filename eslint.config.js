import js from '@eslint/js';
import configPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Math methods with implementation-defined results (ES spec: "implementation-approximated").
// Any of these inside the engine can make the same seed replay differently across browsers.
// Curve shapes live as piecewise-linear tables in /data instead (exact arithmetic only).
const impreciseMathMethods = [
  'random',
  'exp',
  'expm1',
  'log',
  'log1p',
  'log2',
  'log10',
  'pow',
  'sqrt',
  'cbrt',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'sinh',
  'cosh',
  'tanh',
  'asinh',
  'acosh',
  'atanh',
  'hypot',
];

// Ambient browser/runtime state the engine must never touch. The engine is a pure
// fold over (state, action, rng); everything else is the UI layer's business.
const ambientGlobals = [
  'window',
  'document',
  'navigator',
  'fetch',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'crypto',
  'performance',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'requestAnimationFrame',
  'requestIdleCallback',
  'setTimeout',
  'setInterval',
  'queueMicrotask',
  'alert',
  'confirm',
  'prompt',
];

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // ---------------------------------------------------------------------------
  // ENGINE PURITY BOUNDARY (constitution: deterministic, seeded simulation).
  // src/engine/** is a pure fold: step(state, action, rng) -> state.
  // No UI imports, no ambient state, no wall clock, no imprecise Math.
  // Never relax these rules to make a test pass; fix the engine instead.
  // ---------------------------------------------------------------------------
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*', 'zustand', 'zustand/*'],
              message: 'The engine must not know the UI exists.',
            },
            {
              group: ['**/ui/**', '*.css'],
              message: 'The engine must not import UI modules or styles.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...ambientGlobals.map((name) => ({
          name,
          message: `'${name}' is ambient state; the engine only sees (state, action, rng).`,
        })),
        {
          name: 'Date',
          message: 'No wall clock in the engine. Turn count is the only time that exists.',
        },
      ],
      'no-restricted-properties': [
        'error',
        ...impreciseMathMethods.map((property) => ({
          object: 'Math',
          property,
          message: `Math.${property} is not exact across JS engines (or not seeded). Use exact integer/linear math and the seeded rng.`,
        })),
        {
          object: 'Date',
          property: 'now',
          message: 'No wall clock in the engine.',
        },
        {
          object: 'Number',
          property: 'parseFloat',
          message: 'Engine state is scaled integers; parse in the UI/data layer.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'No wall clock in the engine.',
        },
        {
          selector: "CallExpression[callee.name='Date']",
          message: 'No wall clock in the engine.',
        },
      ],
    },
  },

  configPrettier,
);
