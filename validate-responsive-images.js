#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuración de imágenes responsivas
const responsiveImages = {
  'hero-bg': {
    desktop: 'hero-bg-desktop.webp',
    tablet: 'hero-bg-tablet.webp',
    mobile: 'hero-bg-mobile.webp',
    alt: 'Fondo hero de Start Companies'
  },
  'logo': {
    desktop: 'logo-desktop.webp',
    tablet: 'logo-tablet.webp',
    mobile: 'logo-mobile.webp',
    alt: 'Logo de Start Companies'
  },
  'logo-dark': {
    desktop: 'logo-dark-desktop.webp',
    tablet: 'logo-dark-tablet.webp',
    mobile: 'logo-dark-mobile.webp',
    alt: 'Logo oscuro de Start Companies'
  },
  'pricing-bg': {
    desktop: 'pricing-bg-desktop.webp',
    tablet: 'pricing-bg-tablet.webp',
    mobile: 'pricing-bg-mobile.webp',
    alt: 'Fondo de precios'
  }
};

const assetsDir = path.join(__dirname, 'src', 'assets');
const optimizedImagesFile = path.join(__dirname, 'optimized-images.json');

function validateImages() {
  console.log('🔍 Validando imágenes responsivas...');

  let allValid = true;
  const missingImages = [];

  for (const [imageName, variants] of Object.entries(responsiveImages)) {
    for (const [breakpoint, filename] of Object.entries(variants)) {
      if (breakpoint === 'alt') continue;

      const imagePath = path.join(assetsDir, filename);
      if (!fs.existsSync(imagePath)) {
        console.log(`❌ Falta: ${filename}`);
        missingImages.push(filename);
        allValid = false;
      } else {
        console.log(`✅ Existe: ${filename}`);
      }
    }
  }

  if (allValid) {
    console.log('🎉 Todas las imágenes responsivas están presentes');
  } else {
    console.log(`⚠️  Faltan ${missingImages.length} imágenes`);
    console.log('Imágenes faltantes:', missingImages.join(', '));
  }

  return allValid;
}

function generateOptimizedImagesList() {
  const optimizedImages = {};

  for (const [imageName, variants] of Object.entries(responsiveImages)) {
    optimizedImages[imageName] = {
      ...variants,
      priority: imageName === 'hero-bg' || imageName === 'logo'
    };
  }

  fs.writeFileSync(optimizedImagesFile, JSON.stringify(optimizedImages, null, 2));
  console.log('📝 Lista de imágenes optimizadas generada en optimized-images.json');
}

function showStatus() {
  console.log('📊 Estado de imágenes responsivas:');

  for (const [imageName, variants] of Object.entries(responsiveImages)) {
    console.log(`\n🖼️  ${imageName}:`);
    for (const [breakpoint, filename] of Object.entries(variants)) {
      if (breakpoint === 'alt') continue;

      const imagePath = path.join(assetsDir, filename);
      const exists = fs.existsSync(imagePath);
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${breakpoint}: ${filename}`);
    }
  }
}

function cleanup() {
  console.log('🧹 Limpiando archivos temporales...');

  if (fs.existsSync(optimizedImagesFile)) {
    fs.unlinkSync(optimizedImagesFile);
    console.log('🗑️  optimized-images.json eliminado');
  }

  console.log('✨ Limpieza completada');
}

// Manejo de argumentos de línea de comandos
const command = process.argv[2];

switch (command) {
  case 'validate':
    process.exit(validateImages() ? 0 : 1);
    break;
  case 'generate':
    generateOptimizedImagesList();
    break;
  case 'status':
    showStatus();
    break;
  case 'cleanup':
    cleanup();
    break;
  default:
    console.log('Uso: node validate-responsive-images.js [validate|generate|status|cleanup]');
    console.log('');
    console.log('Comandos disponibles:');
    console.log('  validate  - Valida que todas las imágenes responsivas existan');
    console.log('  generate  - Genera la lista de imágenes optimizadas');
    console.log('  status    - Muestra el estado de todas las imágenes');
    console.log('  cleanup   - Limpia archivos temporales');
    process.exit(1);
}
