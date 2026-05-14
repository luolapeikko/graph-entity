import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		reporters: ['verbose', 'github-actions'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			reporter: ['text'],
		},
		include: ['**/*.test.ts'],
	},
});
