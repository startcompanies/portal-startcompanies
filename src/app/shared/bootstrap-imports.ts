// Tree-shaking de Bootstrap - Solo importar componentes necesarios
// En lugar de importar todo Bootstrap, importamos solo lo que necesitamos

// CSS de Bootstrap (solo lo necesario)
import 'bootstrap/dist/css/bootstrap.min.css';

// Inicialización de componentes Bootstrap
// NOTA: Esta función debe ser llamada solo desde el navegador (no en SSR)
// El servicio que la llama debe verificar isBrowser antes de invocarla
export function initializeBootstrapComponents(doc: Document) {
  // Inicializar tooltips si existen
  const tooltipTriggerList = doc.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltipTriggerList.length > 0) {
    // Importar dinámicamente solo cuando sea necesario
    import('bootstrap/js/dist/tooltip').then((module: any) => {
      const Tooltip = module.default || module.Tooltip;
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new Tooltip(tooltipTriggerEl);
      });
    }).catch(() => {
      console.warn('No se pudo cargar Bootstrap Tooltip');
    });
  }

  // Inicializar popovers si existen
  const popoverTriggerList = doc.querySelectorAll('[data-bs-toggle="popover"]');
  if (popoverTriggerList.length > 0) {
    // Importar dinámicamente solo cuando sea necesario
    import('bootstrap/js/dist/popover').then((module: any) => {
      const Popover = module.default || module.Popover;
      popoverTriggerList.forEach((popoverTriggerEl) => {
        new Popover(popoverTriggerEl);
      });
    }).catch(() => {
      console.warn('No se pudo cargar Bootstrap Popover');
    });
  }
}
