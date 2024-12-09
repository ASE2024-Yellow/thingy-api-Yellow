import { resolve as _resolve } from 'path';

export const entry = './server.ts';
export const target = 'node';
export const mode = 'production';
export const module = {
  rules: [
    {
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    },
  ],
};
export const resolve = {
  extensions: ['.ts', '.js'],
};
export const output = {
  filename: 'server.js',
  path: _resolve(__dirname, 'dist'),
};

