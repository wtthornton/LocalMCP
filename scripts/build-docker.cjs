/**
 * Docker Build Script
 * 
 * Compiles TypeScript to CommonJS .cjs files for Docker deployment
 * 
 * Benefits for vibe coders:
 * - Resolves ES module vs CommonJS conflicts
 * - Creates Docker-ready build
 * - Handles all TypeScript compilation issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building LocalMCP for Docker...');

try {
  // Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });

  // Compile TypeScript with Docker-specific config
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.docker.json', { stdio: 'inherit' });

  // Rename all .js files to .cjs
  console.log('🔄 Renaming .js files to .cjs...');
  renameJsToCjs('dist');

  // Copy package.json to dist
  console.log('📋 Copying package.json...');
  fs.copyFileSync('package.json', 'dist/package.json');

  // Copy essential files
  console.log('📁 Copying essential files...');
  const essentialFiles = [
    'README.md',
    '.cursorrules'
  ];

  essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, `dist/${file}`);
    }
  });

  console.log('✅ Docker build complete!');
  console.log('   - All TypeScript compiled to CommonJS');
  console.log('   - All .js files renamed to .cjs');
  console.log('   - Ready for Docker deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

function renameJsToCjs(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      renameJsToCjs(filePath);
    } else if (file.endsWith('.js')) {
      const newPath = filePath.replace('.js', '.cjs');
      fs.renameSync(filePath, newPath);
      console.log(`   Renamed: ${file} → ${path.basename(newPath)}`);
    }
  });
}
