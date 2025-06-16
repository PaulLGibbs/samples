// Simple deploy script for GitHub Pages
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

// Deploy to GitHub Pages
try {
  console.log('Deploying to GitHub Pages...');
  
  // Create .nojekyll file to prevent Jekyll processing
  fs.writeFileSync(path.join(process.cwd(), 'dist', '.nojekyll'), '');
    // Force push to gh-pages branch
  execSync('git add dist -f', { stdio: 'inherit' });
  execSync('git commit -m "Update GitHub Pages"', { stdio: 'inherit' });
  
  // Try to push, if it fails, force push
  try {
    console.log('Attempting to push to gh-pages branch...');
    execSync('git subtree push --prefix dist origin gh-pages', { stdio: 'inherit' });
  } catch (error) {
    console.log('Normal push failed, forcing push...');
    execSync('git push origin `git subtree split --prefix dist HEAD`:gh-pages --force', { stdio: 'inherit' });
  }
  
  console.log('Successfully deployed to GitHub Pages!');
  console.log('Your site should be available at: https://PaulLGibbs.github.io/samples/');
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}
