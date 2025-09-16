const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración de resoluciones
const resolutions = [
  { width: 768, suffix: 'mobile' },
  { width: 1024, suffix: 'tablet' },
  { width: 1920, suffix: 'desktop' }
];

// Configuración de calidad
const qualityConfig = {
  webp: { quality: 80, effort: 6 },
  jpeg: { quality: 80, progressive: true, mozjpeg: true },
  png: { quality: 80, compressionLevel: 9 }
};

// Directorios de imágenes críticas
const criticalImages = [
  'src/assets/hero-bg.png',
  'src/assets/pricing-bg.jpg',
  'src/assets/logo.png',
  'src/assets/logo-dark.png',
  'src/assets/logo-gray.png'
];

// Función para crear imagen responsive
async function createResponsiveImage(inputPath, outputDir, filename, resolution) {
  const { width, suffix } = resolution;
  const nameWithoutExt = path.parse(filename).name;
  const ext = path.parse(filename).ext;
  
  // Crear nombre de archivo con sufijo
  const outputFilename = `${nameWithoutExt}-${suffix}${ext}`;
  const outputPath = path.join(outputDir, outputFilename);
  
  try {
    // Redimensionar y optimizar imagen
    await sharp(inputPath)
      .resize(width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFormat(ext.replace('.', ''))
      .jpeg(qualityConfig.jpeg)
      .png(qualityConfig.png)
      .toFile(outputPath);
    
    // Crear versión WebP
    const webpFilename = `${nameWithoutExt}-${suffix}.webp`;
    const webpPath = path.join(outputDir, webpFilename);
    
    await sharp(inputPath)
      .resize(width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp(qualityConfig.webp)
      .toFile(webpPath);
    
    console.log(`✅ Creada: ${outputFilename} (${width}w) y ${webpFilename}`);
    
    return { jpeg: outputPath, webp: webpPath };
  } catch (error) {
    console.error(`❌ Error creando ${outputFilename}:`, error.message);
    return null;
  }
}

// Función principal
async function createResponsiveImages() {
  console.log('🚀 Iniciando creación de imágenes responsive...\n');
  
  let totalProcessed = 0;
  let totalCreated = 0;
  
  for (const imagePath of criticalImages) {
    if (fs.existsSync(imagePath)) {
      const dir = path.dirname(imagePath);
      const filename = path.basename(imagePath);
      
      console.log(`📁 Procesando: ${filename}`);
      
      for (const resolution of resolutions) {
        const result = await createResponsiveImage(imagePath, dir, filename, resolution);
        if (result) {
          totalCreated += 2; // JPEG + WebP
        }
      }
      
      totalProcessed++;
    } else {
      console.log(`⚠️ Archivo no encontrado: ${imagePath}`);
    }
  }
  
  console.log(`\n🎉 Proceso completado!`);
  console.log(`📊 Resumen:`);
  console.log(`   • Imágenes procesadas: ${totalProcessed}`);
  console.log(`   • Archivos creados: ${totalCreated}`);
  console.log(`   • Resoluciones: ${resolutions.map(r => r.width + 'w').join(', ')}`);
  
  // Crear archivo de configuración para el componente
  createImageConfig();
}

// Función para crear configuración de imágenes
function createImageConfig() {
  const imageConfig = {
    hero: {
      mobile: '/assets/hero-bg-mobile.jpg',
      tablet: '/assets/hero-bg-tablet.jpg',
      desktop: '/assets/hero-bg.jpg',
      fallback: '/assets/hero-bg.jpg',
      alt: 'Hero Background'
    },
    pricing: {
      mobile: '/assets/pricing-bg-mobile.jpg',
      tablet: '/assets/pricing-bg-tablet.jpg',
      desktop: '/assets/pricing-bg.jpg',
      fallback: '/assets/pricing-bg.jpg',
      alt: 'Pricing Background'
    },
    logo: {
      mobile: '/assets/logo-mobile.png',
      tablet: '/assets/logo-tablet.png',
      desktop: '/assets/logo.png',
      fallback: '/assets/logo.png',
      alt: 'Start Companies Logo'
    }
  };
  
  const configPath = 'src/app/config/image-config.ts';
  const configContent = `// Configuración de imágenes responsive generada automáticamente
export const IMAGE_CONFIG = ${JSON.stringify(imageConfig, null, 2)};

export interface ImageConfig {
  mobile: string;
  tablet: string;
  desktop: string;
  fallback: string;
  alt: string;
}
`;
  
  // Crear directorio si no existe
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, configContent);
  console.log(`📝 Configuración creada: ${configPath}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createResponsiveImages().catch(console.error);
}

module.exports = { createResponsiveImages };
