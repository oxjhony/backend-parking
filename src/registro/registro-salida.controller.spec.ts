// Proxy para ejecutar pruebas ubicadas en la carpeta test
// Mantiene compatibilidad con la configuración actual de Jest (rootDir: src)
// Usamos require para evitar restricciones de TypeScript sobre imports con extensión .ts
require('../../test/registro-salida.controller.spec.ts');