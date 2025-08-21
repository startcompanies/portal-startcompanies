const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuración de resoluciones
const resolutions = [
  { width: 768, suffix: 'mobile' },
  { width: 1024, suffix: 'tablet' },
  { width: 1920, suffix: 'desktop' }
];

// Imágenes críticas que deben tener versiones responsive
const criticalImages = [
  'src/assets/hero-bg.jpg',
  'src/assets/pricing-bg.jpg',
  'src/assets/logo.png',
  'src/assets/logo-dark.png',
  'src/assets/logo-gray.png'
];

// Función para verificar si una imagen responsive existe
function imageExists(imagePath) {
  return fs.existsSync(imagePath);
}

// Función para verificar qué imágenes responsive faltan
function getMissingImages() {
  const missingImages = [];
  
  for (const imagePath of criticalImages) {
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️ Imagen base no encontrada: ${imagePath}`);
      continue;
    }
    
    const dir = path.dirname(imagePath);
    const filename = path.parse(imagePath).name;
    const ext = path.parse(imagePath).ext;
    
    for (const resolution of resolutions) {
      const { width, suffix } = resolution;
      
      // Verificar JPEG/PNG
      const jpegPath = path.join(dir, `${filename}-${suffix}${ext}`);
      const webpPath = path.join(dir, `${filename}-${suffix}.webp`);
      
      if (!imageExists(jpegPath)) {
        missingImages.push({
          type: 'jpeg',
          input: imagePath,
          output: jpegPath,
          resolution: width,
          suffix: suffix
        });
      }
      
      if (!imageExists(webpPath)) {
        missingImages.push({
          type: 'webp',
          input: imagePath,
          output: webpPath,
          resolution: width,
          suffix: suffix
        });
      }
    }
  }
  
  return missingImages;
}

// Función para generar imagen responsive
async function generateResponsiveImage(item) {
  const { type, input, output, resolution, suffix } = item;
  
  try {
    console.log(`🔄 Generando: ${path.basename(output)} (${resolution}w)`);
    
    let pipeline = sharp(input).resize(resolution, null, { 
      withoutEnlargement: true,
      fit: 'inside'
    });
    
    if (type === 'webp') {
      await pipeline.webp({ quality: 80, effort: 6 }).toFile(output);
    } else {
      const ext = path.parse(input).ext.replace('.', '');
      if (ext === 'jpg' || ext === 'jpeg') {
        await pipeline.jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(output);
      } else if (ext === 'png') {
        await pipeline.png({ quality: 80, compressionLevel: 9 }).toFile(output);
      }
    }
    
    console.log(`✅ Generada: ${path.basename(output)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error generando ${path.basename(output)}:`, error.message);
    return false;
  }
}

// Función principal de validación
async function validateAndGenerateImages() {
  console.log('🔍 Validando imágenes responsive existentes...\n');
  
  const missingImages = getMissingImages();
  
  if (missingImages.length === 0) {
    console.log('🎉 ¡Todas las imágenes responsive ya existen!');
    console.log('💡 No es necesario regenerar nada.');
    return { status: 'complete', generated: 0 };
  }
  
  console.log(`📊 Imágenes faltantes encontradas: ${missingImages.length}\n`);
  
  let generated = 0;
  let failed = 0;
  
  for (const item of missingImages) {
    const success = await generateResponsiveImage(item);
    if (success) {
      generated++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📈 Resumen de validación:`);
  console.log(`   • Imágenes generadas: ${generated}`);
  console.log(`   • Errores: ${failed}`);
  console.log(`   • Total procesadas: ${missingImages.length}`);
  
  return { status: 'partial', generated, failed };
}

// Función para verificar estado completo
function showImageStatus() {
  console.log('\n📋 Estado actual de imágenes responsive:\n');
  
  for (const imagePath of criticalImages) {
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ ${path.basename(imagePath)}: IMAGEN BASE NO ENCONTRADA`);
      continue;
    }
    
    const dir = path.dirname(imagePath);
    const filename = path.parse(imagePath).name;
    const ext = path.parse(imagePath).ext;
    
    console.log(`📁 ${path.basename(imagePath)}:`);
    
    for (const resolution of resolutions) {
      const { width, suffix } = resolution;
      const jpegPath = path.join(dir, `${filename}-${suffix}${ext}`);
      const webpPath = path.join(dir, `${filename}-${suffix}.webp`);
      
      const jpegExists = imageExists(jpegPath);
      const webpExists = imageExists(webpPath);
      
      console.log(`   ${jpegExists ? '✅' : '❌'} ${suffix} (${width}w): ${jpegExists ? 'JPEG/PNG' : 'FALTA'} | ${webpExists ? 'WebP' : 'FALTA WebP'}`);
    }
    console.log('');
  }
}

// Función para limpiar imágenes responsive (opcional)
function cleanupResponsiveImages() {
  console.log('🧹 Limpiando todas las imágenes responsive...\n');
  
  let cleaned = 0;
  
  for (const imagePath of criticalImages) {
    if (!fs.existsSync(imagePath)) continue;
    
    const dir = path.dirname(imagePath);
    const filename = path.parse(imagePath).name;
    
    for (const resolution of resolutions) {
      const { suffix } = resolution;
      const jpegPath = path.join(dir, `${filename}-${suffix}${path.parse(imagePath).ext}`);
      const webpPath = path.join(dir, `${filename}-${suffix}.webp`);
      
      if (imageExists(jpegPath)) {
        fs.unlinkSync(jpegPath);
        console.log(`🗑️ Eliminada: ${path.basename(jpegPath)}`);
        cleaned++;
      }
      
      if (imageExists(webpPath)) {
        fs.unlinkSync(webpPath);
        console.log(`🗑️ Eliminada: ${path.basename(webpPath)}`);
        cleaned++;
      }
    }
  }
  
  console.log(`\n🧹 Limpieza completada: ${cleaned} archivos eliminados`);
}

// Función principal
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'validate':
      await validateAndGenerateImages();
      break;
    case 'status':
      showImageStatus();
      break;
    case 'cleanup':
      cleanupResponsiveImages();
      break;
    case 'generate':
      await validateAndGenerateImages();
      break;
    default:
      console.log('🔍 Script de validación de imágenes responsive\n');
      console.log('Comandos disponibles:');
      console.log('  npm run validate:images     - Validar y generar solo las faltantes');
      console.log('  npm run status:images       - Mostrar estado de todas las imágenes');
      console.log('  npm run cleanup:images      - Limpiar todas las imágenes responsive');
      console.log('  npm run generate:images     - Forzar generación de todas las imágenes');
      break;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateAndGenerateImages, showImageStatus, cleanupResponsiveImages };
