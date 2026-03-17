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

// Función para optimizar una imagen (sin añadir fondo; preservar transparencia en logos)
async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const { width, height, quality = 80, format = 'webp', preserveAlpha = false } = options;
    
    let pipeline = sharp(inputPath);
    // Logos: asegurar canal alpha para que WebP/PNG no reciban fondo opaco
    if (preserveAlpha) {
      pipeline = pipeline.ensureAlpha();
    }
    
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    if (format === 'webp') {
      // Preservar transparencia: no flatten; alphaQuality alto para logos sin fondo
      pipeline = pipeline.webp({ quality, alphaQuality: preserveAlpha ? 100 : 90 });
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

// Configuración de imágenes que necesitan versiones responsive (solo logo y logo-dark; sin logo-grey/logo-gray)
const responsiveImageConfig = {
  'logo': { mobile: 768, tablet: 1024, desktop: 2482 },
  'logo-dark': { mobile: 768, tablet: 1024, desktop: 2482 },
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

  // Logos: mantener proporción (solo width); no forzar height para no deformar aspecto ~2.47:1
  const isLogo = baseName.includes('logo');
  const resizeHeight = isLogo ? undefined : undefined;

  for (const version of versions) {
    const sourcePath = path.join(baseDir, version.name);
    const forceOverwrite = baseName === 'logo' || baseName === 'logo-dark';

    // Crear versión responsive en src/assets (si no existe o si es logo/logo-dark para regenerar)
    if (forceOverwrite || !fs.existsSync(sourcePath)) {
      const devOutputPath = sourcePath;
      const devOutputDirPath = path.dirname(devOutputPath);
      if (!fs.existsSync(devOutputDirPath)) {
        fs.mkdirSync(devOutputDirPath, { recursive: true });
      }

      const keepAlpha = baseName === 'logo' || baseName === 'logo-dark';
      await optimizeImage(inputPath, devOutputPath, {
        width: version.size,
        height: resizeHeight,
        quality: 100,
        format: 'png',
        preserveAlpha: keepAlpha
      });

      const devWebpPath = devOutputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      await optimizeImage(inputPath, devWebpPath, {
        width: version.size,
        height: resizeHeight,
        quality: 85,
        format: 'webp',
        preserveAlpha: keepAlpha
      });
    }

    const sourceImage = fs.existsSync(sourcePath) ? sourcePath : inputPath;
    const outputPath = path.join(outputDir, relativePath.replace(path.basename(inputPath), version.name).replace(/\.(jpg|jpeg|png)$/i, '.webp'));

    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    const keepAlpha = baseName === 'logo' || baseName === 'logo-dark';
    await optimizeImage(sourceImage, outputPath, {
      width: version.size,
      height: resizeHeight,
      quality: 85,
      format: 'webp',
      preserveAlpha: keepAlpha
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
        // Generar base WebP en src/assets para desarrollo (logo y logo-dark)
        if (nameWithoutExt === 'logo' || nameWithoutExt === 'logo-dark') {
          const baseDir = path.dirname(fullPath);
          const baseWebpPath = path.join(baseDir, `${nameWithoutExt}.webp`);
          await optimizeImage(fullPath, baseWebpPath, { quality: 85, format: 'webp', preserveAlpha: true });
        }
      }
      
      // También optimizar la imagen original (logos sin fondo: preserveAlpha)
      const outputPath = path.join(outputDir, relativeItemPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
      
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }
      
      const isLogoAsset = nameWithoutExt === 'logo' || nameWithoutExt === 'logo-dark';
      await optimizeImage(fullPath, outputPath, {
        quality: isLogoAsset ? 85 : 80,
        format: 'webp',
        preserveAlpha: isLogoAsset
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
