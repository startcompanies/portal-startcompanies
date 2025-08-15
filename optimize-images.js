const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminWebp = require('imagemin-webp');
const fs = require('fs');
const path = require('path');

// Configuración de optimización
const config = {
  jpeg: {
    quality: 80,
    progressive: true
  },
  png: {
    quality: [0.6, 0.8],
    speed: 4
  },
  webp: {
    quality: 80,
    method: 6
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

// Función para optimizar imágenes
async function optimizeImages() {
  console.log('🚀 Iniciando optimización de imágenes...\n');

  for (const dir of imageDirs) {
    if (fs.existsSync(dir)) {
      console.log(`📁 Procesando directorio: ${dir}`);
      
      try {
        // Optimizar imágenes originales
        const files = await imagemin([`${dir}/*.{jpg,jpeg,png}`], {
          destination: dir,
          plugins: [
            imageminMozjpeg(config.jpeg),
            imageminPngquant(config.png)
          ]
        });

        // Crear versiones WebP
        const webpFiles = await imagemin([`${dir}/*.{jpg,jpeg,png}`], {
          destination: dir,
          plugins: [
            imageminWebp(config.webp)
          ]
        });

        console.log(`✅ ${dir}: ${files.length} imágenes optimizadas, ${webpFiles.length} versiones WebP creadas`);
      } catch (error) {
        console.log(`❌ Error en ${dir}:`, error.message);
      }
    }
  }

  console.log('\n🎉 Optimización completada!');
}

// Función para mostrar estadísticas de archivos
function showFileStats() {
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
showFileStats();
optimizeImages();
