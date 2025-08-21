module.exports = {
  compress: {
    drop_console: true,        // Eliminar console.log en producción
    drop_debugger: true,       // Eliminar debugger statements
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
    passes: 2,                 // Múltiples pasadas de compresión
    unsafe: true,              // Optimizaciones "unsafe" para mejor compresión
    unsafe_comps: true,
    unsafe_Function: true,
    unsafe_math: true,
    unsafe_proto: true,
    unsafe_regexp: true,
    unsafe_undefined: true
  },
  mangle: {
    toplevel: true,            // Mangle nombres de nivel superior
    eval: true,                // Mangle nombres en eval
    keep_fnames: false,        // No mantener nombres de funciones
    reserved: ['$', 'jQuery']  // Nombres reservados
  },
  format: {
    comments: false,           // Eliminar comentarios
    beautify: false,           // No formatear (mantener minificado)
    indent_level: 0
  },
  ecma: 2020,                 // Versión de ECMAScript
  module: true,                // Optimizaciones para módulos ES6
  toplevel: true               // Optimizaciones de nivel superior
};
