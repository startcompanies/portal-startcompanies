// Tree-shaking de Bootstrap - Solo importar componentes necesarios
// En lugar de importar todo Bootstrap, importamos solo lo que necesitamos

// CSS de Bootstrap (solo lo necesario)
import 'bootstrap/dist/css/bootstrap.min.css';

// Inicialización de componentes Bootstrap
export function initializeBootstrapComponents() {
  // Solo inicializar si estamos en el navegador
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Inicializar tooltips si existen
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
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
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
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
}
