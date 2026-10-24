const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

exports.default = function(context) {
  const { appOutDir } = context;
  const resourcesDir = path.join(appOutDir, 'resources');
  const asarPath = path.join(resourcesDir, 'app.asar');
  const unpackDir = path.join(resourcesDir, 'app.asar.unpacked');
  
  if (!fs.existsSync(asarPath)) {
    console.log('No app.asar found, skipping native module injection');
    return;
  }
  
  console.log('Extracting app.asar to add native modules...');
  
  // Create unpacked directory
  if (!fs.existsSync(unpackDir)) {
    fs.mkdirSync(unpackDir, { recursive: true });
  }
  
  // Extract asar using npx asar
  try {
    execSync(`npx asar extract "${asarPath}" "${unpackDir}"`, { stdio: 'inherit' });
    console.log('Extracted app.asar successfully');
  } catch (e) {
    console.error('Failed to extract app.asar:', e);
    return;
  }
  
  // Copy native modules
  const modulesToCopy = ['better-sqlite3', 'bindings', 'file-uri-to-path'];
  const sourceNodeModules = path.join(__dirname, '..', 'apps', 'main', 'node_modules');
  const targetNodeModules = path.join(unpackDir, 'node_modules');
  
  for (const mod of modulesToCopy) {
    const source = path.join(sourceNodeModules, mod);
    const dest = path.join(targetNodeModules, mod);
    
    if (fs.existsSync(source)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true });
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      copyRecursive(source, dest);
      console.log(`Copied ${mod} to unpacked app`);
    }
  }
  
  // Repack asar
  try {
    fs.unlinkSync(asarPath);
    execSync(`npx asar pack "${unpackDir}" "${asarPath}"`, { stdio: 'inherit' });
    console.log('Repacked app.asar with native modules');
  } catch (e) {
    console.error('Failed to repack app.asar:', e);
    return;
  }
  
  // Clean up unpacked directory
  fs.rmSync(unpackDir, { recursive: true, force: true });
  console.log('Cleaned up unpacked directory');
};

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
