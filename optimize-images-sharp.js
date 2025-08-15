const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración de optimización
const config = {
  jpeg: {
    quality: 80,
    progressive: true,
    mozjpeg: true
  },
  png: {
    quality: 80,
    compressionLevel: 9
  },
  webp: {
    quality: 80,
    effort: 6
  }
};

// Directorios de imágenes
const imageDirs = [
  'src/assets',
  'src/assets/benefits',
  'src/assets/blog',
  'src/assets/footer',
  'src/assets/open-llc',
  'src/assets/relay',
  'src/assets/services',
  'src/assets/tabs',
  'src/assets/testimonials',
  'src/assets/us'
];

// Función para optimizar una imagen individual
async function optimizeImage(inputPath, outputPath, format) {
  try {
    let pipeline = sharp(inputPath);
    
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg(config.jpeg);
        break;
      case 'png':
        pipeline = pipeline.png(config.png);
        break;
      case 'webp':
        pipeline = pipeline.webp(config.webp);
        break;
    }
    
    await pipeline.toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`❌ Error optimizando ${inputPath}:`, error.message);
    return false;
  }
}

// Función para procesar todas las imágenes
async function processImages() {
  console.log('🚀 Iniciando optimización de imágenes con Sharp...\n');
  
  let totalProcessed = 0;
  let totalOptimized = 0;
  let totalWebPCreated = 0;

  for (const dir of imageDirs) {
    if (fs.existsSync(dir)) {
      console.log(`📁 Procesando directorio: ${dir}`);
      
      const files = fs.readdirSync(dir).filter(file => 
        /\.(jpg|jpeg|png)$/i.test(file)
      );
      
      for (const file of files) {
        const inputPath = path.join(dir, file);
        const stats = fs.statSync(inputPath);
        const originalSize = stats.size;
        
        console.log(`  📸 Procesando: ${file} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);
        
        // Determinar formato de salida
        const isJpeg = /\.(jpg|jpeg)$/i.test(file);
        const outputFormat = isJpeg ? 'jpeg' : 'png';
        
        // Crear nombre de archivo optimizado
        const nameWithoutExt = path.parse(file).name;
        const optimizedFile = `${nameWithoutExt}-optimized.${outputFormat === 'jpeg' ? 'jpg' : 'png'}`;
        const optimizedPath = path.join(dir, optimizedFile);
        
        // Crear nombre de archivo WebP
        const webpFile = `${nameWithoutExt}.webp`;
        const webpPath = path.join(dir, webpFile);
        
        // Optimizar imagen original
        const optimized = await optimizeImage(inputPath, optimizedPath, outputFormat);
        if (optimized) {
          totalOptimized++;
          
          // Verificar tamaño optimizado
          if (fs.existsSync(optimizedPath)) {
            const optimizedStats = fs.statSync(optimizedPath);
            const optimizedSize = optimizedStats.size;
            const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
            console.log(`    ✅ Optimizada: ${reduction}% reducción`);
          }
        }
        
        // Crear versión WebP
        const webpCreated = await optimizeImage(inputPath, webpPath, 'webp');
        if (webpCreated) {
          totalWebPCreated++;
          console.log(`    🌐 WebP creado`);
        }
        
        totalProcessed++;
      }
    }
  }

  console.log(`\n🎉 Optimización completada!`);
  console.log(`📊 Resumen:`);
  console.log(`   • Total procesadas: ${totalProcessed}`);
  console.log(`   • Optimizadas: ${totalOptimized}`);
  console.log(`   • WebP creados: ${totalWebPCreated}`);
}

// Función para mostrar estadísticas antes y después
function showStats() {
  console.log('\n📊 Estadísticas de archivos de imagen:\n');
  
  let totalSize = 0;
  let totalFiles = 0;

  for (const dir of imageDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(file => 
        /\.(jpg|jpeg|png|webp)$/i.test(file)
      );
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        totalFiles++;
        
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${filePath}: ${sizeInMB} MB`);
      }
    }
  }

  const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`\n📈 Total: ${totalFiles} archivos, ${totalSizeInMB} MB`);
}

// Ejecutar optimización
showStats();
processImages();
