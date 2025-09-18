#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando optimización de imágenes para producción...');

const assetsDir = path.join(__dirname, 'src/assets');
const outputDir = path.join(__dirname, 'dist/portal-startcompanies/browser/assets');

// Crear directorio de salida si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Función para optimizar una imagen
async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    let pipeline = sharp(inputPath);
    
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9 });
    }
    
    await pipeline.toFile(outputPath);
    console.log(`✅ Optimizada: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ Error optimizando ${inputPath}:`, error.message);
  }
}

// Función recursiva para procesar directorios
async function processDirectory(dir, relativePath = '') {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativeItemPath = path.join(relativePath, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      await processDirectory(fullPath, relativeItemPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(item)) {
      const nameWithoutExt = path.parse(item).name;
      const outputPath = path.join(outputDir, relativeItemPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
      
      // Crear directorio padre si no existe
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }
      
      // Optimizar imagen
      await optimizeImage(fullPath, outputPath, {
        quality: 80,
        format: 'webp'
      });
    }
  }
}

// Procesar todas las imágenes
async function main() {
  try {
    await processDirectory(assetsDir);
    console.log('🎉 Optimización completada exitosamente!');
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
    process.exit(1);
  }
}

main();
