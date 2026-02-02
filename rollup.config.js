import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import cleaner from 'rollup-plugin-cleaner';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/esm/index.esm.js',
        format: 'esm',
        sourcemap: false,
      },
      {
        file: 'dist/cjs/index.cjs.js',
        format: 'cjs',
        sourcemap: false,
        exports: 'named'
      }
    ],
    external: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/autocomplete',
      '@codemirror/language',
      '@codemirror/lint',
      '@lezer/highlight',
      '@lezer/lr',
    ],
    plugins: [
      cleaner({
        targets: ['./dist/'],
      }),
      resolve({
        resolveOnly: [/^(?!@codemirror|@lezer).*$/]
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.ts'],
      }),
      terser()
    ]
  },
  {
    input: 'dist/esm/types/index.d.ts',
        output: [
            {
                file: 'dist/index.d.ts',
                format: 'esm',
            },
        ],
    plugins: [dts()]
  }
];