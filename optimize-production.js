#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Intentar cargar sharp, si no está disponible, continuar sin optimizar
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('⚠️  Sharp no está disponible, saltando optimización de imágenes');
  console.warn('   Las imágenes no se convertirán a WebP automáticamente');
  console.warn('   El build continuará normalmente');
  process.exit(0); // Salir exitosamente sin optimizar
}

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

// Configuración de imágenes que necesitan versiones responsive
const responsiveImageConfig = {
  'logo-grey': { mobile: 768, tablet: 1024, desktop: 2482 },
  'logo': { mobile: 768, tablet: 1024, desktop: 2482 },
  'logo-dark': { mobile: 768, tablet: 1024, desktop: 2482 },
  'logo-gray': { mobile: 768, tablet: 1024, desktop: 2482 },
  'hero-bg': { mobile: 768, tablet: 1024, desktop: 1920 },
  'pricing-bg': { mobile: 768, tablet: 1024, desktop: 1920 }
};

// Función para crear versiones responsive de una imagen
async function createResponsiveVersions(inputPath, baseName, relativePath) {
  const config = responsiveImageConfig[baseName];
  if (!config) return;

  const ext = path.extname(inputPath);
  const baseDir = path.dirname(inputPath);
  
  // Crear versiones mobile, tablet y desktop
  const versions = [
    { name: `${baseName}-mobile${ext}`, size: config.mobile },
    { name: `${baseName}-tablet${ext}`, size: config.tablet },
    { name: `${baseName}-desktop${ext}`, size: config.desktop }
  ];

  const isLogo = baseName.includes('logo');

  for (const version of versions) {
    const sourcePath = path.join(baseDir, version.name);
    
    // Crear versión responsive en src/assets si no existe (para desarrollo)
    if (!fs.existsSync(sourcePath)) {
      const devOutputPath = sourcePath;
      const devOutputDirPath = path.dirname(devOutputPath);
      if (!fs.existsSync(devOutputDirPath)) {
        fs.mkdirSync(devOutputDirPath, { recursive: true });
      }
      
      // Crear versión responsive PNG en src/assets
      await optimizeImage(inputPath, devOutputPath, {
        width: version.size,
        height: isLogo ? version.size : undefined,
        quality: 100,
        format: 'png'
      });
      
      // También crear versión WebP en src/assets
      const devWebpPath = devOutputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      await optimizeImage(inputPath, devWebpPath, {
        width: version.size,
        height: isLogo ? version.size : undefined,
        quality: 85,
        format: 'webp'
      });
    }
    
    // Crear versión para producción (dist)
    const sourceImage = fs.existsSync(sourcePath) ? sourcePath : inputPath;
    const outputPath = path.join(outputDir, relativePath.replace(path.basename(inputPath), version.name).replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    
    // Crear directorio padre si no existe
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }
    
    // Crear versión responsive y convertir a WebP para producción
    await optimizeImage(sourceImage, outputPath, {
      width: version.size,
      height: isLogo ? version.size : undefined,
      quality: 85,
      format: 'webp'
    });
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
      
      // Verificar si es una imagen base que necesita versiones responsive
      const needsResponsive = Object.keys(responsiveImageConfig).some(baseName => {
        // Verificar si el nombre coincide exactamente con un base name
        // o si es una versión responsive existente (no procesar de nuevo)
        return nameWithoutExt === baseName && 
               !nameWithoutExt.includes('-mobile') && 
               !nameWithoutExt.includes('-tablet') && 
               !nameWithoutExt.includes('-desktop');
      });
      
      if (needsResponsive) {
        // Crear versiones responsive
        await createResponsiveVersions(fullPath, nameWithoutExt, relativeItemPath);
      }
      
      // También optimizar la imagen original
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
