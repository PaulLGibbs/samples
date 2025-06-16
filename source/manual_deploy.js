// Manual deployment script for GitHub Pages
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Build the project first
console.log('Building the project...');
execSync('npm run build', { stdio: 'inherit' });

// Check if dist folder exists
if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
  console.error('Dist folder does not exist. Build may have failed.');
  process.exit(1);
}

// Create .nojekyll file to prevent Jekyll processing
fs.writeFileSync(path.join(process.cwd(), 'dist', '.nojekyll'), '');

try {
  console.log('Manually deploying to GitHub Pages...');

  // Create a temporary orphan branch
  execSync('git checkout --orphan gh-pages-temp', { stdio: 'inherit' });

  // Remove all files from the index (ensure clean branch)
  execSync('git rm -rf .', { stdio: 'inherit' });

  // Copy dist contents to root for commit
  const distPath = path.join(process.cwd(), 'dist');
  const files = fs.readdirSync(distPath);
  for (const file of files) {
    const src = path.join(distPath, file);
    const dest = path.join(process.cwd(), file);
    if (fs.existsSync(dest)) {
      if (fs.lstatSync(dest).isDirectory()) {
        fs.rmSync(dest, { recursive: true, force: true });
      } else {
        fs.unlinkSync(dest);
      }
    }
    fs.cpSync(src, dest, { recursive: true });
  }

  // Copy source files to a 'source' directory for public viewing
  const sourceDir = path.join(process.cwd(), 'source');
  if (!fs.existsSync(sourceDir)) {
    fs.mkdirSync(sourceDir);
  }
  const sourceFiles = [
    'index.html',
    'main.js',
    'print-screenshot-tool.js',
    'draw-extent.js',
    'layer-manager.js',
    'extent-expand.js',
    'styles.css',
    'README.md',
    'vite.config.js',
    'deploy.js',
    'manual_deploy.js'
  ];
  for (const file of sourceFiles) {
    const src = path.join(process.cwd(), file);
    const dest = path.join(sourceDir, file);
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  }

  // Add and commit all files (now only dist content and source are present)
  execSync('git add --all', { stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages (with source)"', { stdio: 'inherit' });

  // Force push to gh-pages branch
  execSync('git push -f origin HEAD:gh-pages', { stdio: 'inherit' });

  // Clean up: remove copied files and source directory
  for (const file of files) {
    const dest = path.join(process.cwd(), file);
    if (fs.existsSync(dest)) {
      if (fs.lstatSync(dest).isDirectory()) {
        fs.rmSync(dest, { recursive: true, force: true });
      } else {
        fs.unlinkSync(dest);
      }
    }
  }
  if (fs.existsSync(sourceDir)) {
    fs.rmSync(sourceDir, { recursive: true, force: true });
  }

  // Go back to the original branch
  execSync('git checkout -f main', { stdio: 'inherit' });

  // Delete the temporary branch
  execSync('git branch -D gh-pages-temp', { stdio: 'inherit' });

  console.log('Successfully deployed to GitHub Pages!');
  console.log('Your site should be available at: https://PaulLGibbs.github.io/samples/');
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}
