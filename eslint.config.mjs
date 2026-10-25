// Mirrors the lint configuration that @n8n/scan-community-package applies when
// n8n reviews a node for verification, so `npm run lint` catches locally what
// the verification scanner would reject.
//
// The scanner builds its config in scanner/scanner.mjs (buildScanConfig). If a
// future scanner release changes the rule set, run it against the published
// package to confirm this file is still equivalent:
//
//   npx @n8n/scan-community-package n8n-nodes-jeffy@<version>
import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';
import n8nNodesPlugin from 'eslint-plugin-n8n-nodes-base';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';

export default defineConfig(
	{
		ignores: ['dist/**', 'node_modules/**', 'examples/**'],
	},
	n8nCommunityNodesPlugin.configs.recommended,
	{
		files: ['**/*.node.ts', '**/*.credentials.ts'],
		plugins: { 'n8n-nodes-base': n8nNodesPlugin },
		rules: {
			'n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options': 'error',
			'n8n-nodes-base/node-param-description-wrong-for-dynamic-options': 'error',
		},
	},
	{
		files: ['**/*.ts'],
		languageOptions: { parser: tsParser },
	},
);
