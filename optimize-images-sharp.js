const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

const registryPath = 'optimized-images.json';
let registry = {};

// Cargar el registro existente
if (fs.existsSync(registryPath)) {
  registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

// Función para generar un hash de una imagen
function generateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Función para verificar si una imagen necesita optimización
function needsOptimization(filePath) {
  const currentHash = generateHash(filePath);
  return registry[filePath] !== currentHash;
}

// Función para actualizar el registro después de la optimización
function updateRegistry(filePath) {
  const newHash = generateHash(filePath);
  registry[filePath] = newHash;
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

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
        if (needsOptimization(inputPath)) {
          const stats = fs.statSync(inputPath);
          const originalSize = stats.size;
          
          console.log(`  📸 Procesando: ${file} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);
          
          // Determinar formato de salida
          const isJpeg = /\.(jpg|jpeg)$/i.test(file);
          const outputFormat = isJpeg ? 'jpeg' : 'png';
          
          // Optimizar imagen original y sobrescribir
          const optimized = await optimizeImage(inputPath, inputPath, outputFormat);
          if (optimized) {
            updateRegistry(inputPath);
            totalOptimized++;
            // Verificar tamaño optimizado
            if (fs.existsSync(inputPath)) {
              const optimizedStats = fs.statSync(inputPath);
              const optimizedSize = optimizedStats.size;
              const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
              console.log(`    ✅ Optimizada: ${reduction}% reducción`);
            }
          }
          
          // Crear versión WebP optimizada
          const webpPath = path.join(dir, `${path.parse(file).name}.webp`);
          const webpCreated = await optimizeImage(inputPath, webpPath, 'webp');
          if (webpCreated) {
            totalWebPCreated++;
            console.log(`    🌐 WebP creado`);
          }
          
          totalProcessed++;
        } else {
          console.log(`    🔄 ${file} ya está optimizada.`);
        }
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
