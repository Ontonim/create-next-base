#!/usr/bin/env node

import prompts from 'prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

console.log(`\n🧰 ONTONIM CLI v${pkg.version}\n`);

console.log(chalk.green.bold('\n🚀 Creating Next.js App with App Router + Tailwind CSS + TypeScript\n'));

const res = await prompts([
  {
    type: 'text',
    name: 'projectName',
    message: 'Project name:',
    validate: value => value.trim() === '' ? 'Project name is required' : true
  },
  {
    type: 'confirm',
    name: 'addAuth',
    message: 'Add NextAuth.js?',
    initial: true
  },
  {
    type: 'confirm',
    name: 'addPrisma',
    message: 'Add Prisma ORM?',
    initial: false
  }
]);

const { projectName, addAuth, addPrisma } = res;

if (!projectName) {
  console.log(chalk.red('❌ Project name is required!'));
  process.exit(1);
}

// 1. Create Next.js app with Tailwind CSS
console.log(chalk.green('\n📦 Creating Next.js app with Tailwind CSS...'));
execSync(`pnpm create next-app ${projectName} --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm`, {
  stdio: 'inherit'
});

const projectPath = path.join(process.cwd(), projectName);

// 2. Clean up conflicts
console.log(chalk.green('\n🧹 Cleaning up any conflicting files...'));
const conflicts = [
  path.join(projectPath, 'pages'),
  path.join(projectPath, 'src', 'pages'),
  path.join(projectPath, 'src', 'app', 'page.tsx')
];

conflicts.forEach(path => {
  if (fs.existsSync(path)) {
    fs.removeSync(path);
  }
});

// 3. Copy your template
console.log(chalk.green('\n📁 Copying ONTONIM template...'));
const templatePath = path.join(__dirname, 'professional-template');
await fs.copy(templatePath, projectPath);

// 3.5. Replace README.md with custom version
console.log(chalk.green('\n📝 Writing custom README.md...'));
const customReadmePath = path.join(__dirname, 'README.md');
const targetReadmePath = path.join(projectPath, 'README.md');

if (fs.existsSync(customReadmePath)) {
  await fs.copy(customReadmePath, targetReadmePath);
} else {
  console.log(chalk.yellow('⚠️ custom-readme.md not found, skipping README update.'));
}


process.chdir(projectPath);

// 4. Verify Tailwind CSS installation
console.log(chalk.green('\n🎨 Verifying Tailwind CSS configuration...'));

// Tailwind config file
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
fs.writeFileSync('tailwind.config.js', tailwindConfig);

// Global CSS file
const globalCSS = `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* Your custom styles here */
`;
fs.writeFileSync('src/app/globals.css', globalCSS);

// 5. Initialize shadcn
console.log(chalk.green('\n🔧 Setting up shadcn/ui...'));
execSync('pnpm dlx shadcn@latest init -y', { stdio: 'inherit' });

// 6. Add shadcn components
console.log(chalk.green('\n🛠️ Adding shadcn components...'));
const shadcnComponents = [
  'button', 'input', 'dropdown-menu', 'table', 'card',
  'dialog', 'alert-dialog', 'avatar', 'badge', 'form',
  'label', 'skeleton', 'sheet'
];

shadcnComponents.forEach(component => {
  try {
    execSync(`pnpm dlx shadcn@latest add ${component}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Issue adding ${component}: ${error.message}`));
  }
});

// 7. Install additional dependencies
console.log(chalk.blue('\n📦 Installing dependencies...'));
const packages = [
  'clsx',
  'tailwind-merge',
  'tailwindcss-animate',
  'lucide-react',
  'date-fns',
  'zod',
  'react-hook-form',
  '@hookform/resolvers',
  'sonner'
];

if (addAuth) {
  packages.push('next-auth', '@auth/core');
}

if (addPrisma) {
  packages.push('prisma', '@prisma/client');
}

execSync(`pnpm add ${packages.join(' ')}`, { stdio: 'inherit' });

// 8. Initialize Prisma if selected
if (addPrisma) {
  console.log(chalk.green('\n💾 Initializing Prisma...'));
  execSync('pnpm dlx prisma init', { stdio: 'inherit' });
}

// 9. Initialize git
console.log(chalk.green('\n🔧 Initializing git...'));
execSync('git init', { stdio: 'inherit' });
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "Initial commit: ONTONIM boilerplate"', { stdio: 'inherit' });

// 10. Start dev server
console.log(chalk.green.bold('\n✅ Project setup complete! Now you can start the development server.\n'));
console.log(chalk.bold('Next steps:'));
console.log(chalk.cyan(`\n👉 1. cd ${projectName}`));
console.log(chalk.cyan('👉 2. pnpm dev'));
console.log(chalk.yellow('\n💡 You can start building your app now!\n'));
console.log(chalk.green.bold('Happy Coding! 👨‍💻'))