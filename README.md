# SynergiaBio — MVP de gestión y trazabilidad

Aplicación web local para registrar residuos, ejecutar controles de bioseguridad, monitorear indicadores y generar un borrador RETC sujeto a revisión humana.

Incluye un módulo de costos y circularidad para bandejas y macetas, con catálogo de precios en pesos chilenos, registro diario de unidades utilizadas, recicladas y desechadas, reportes mensuales/anuales y cálculo de pérdida y recuperación económica.

También incorpora un módulo exclusivo de barbecho químico con capacidad máxima de 1.000 litros, registro diario de líquidos de triple lavado y tipo de plaguicida, control de evaporación, proyecciones semanales/mensuales y alertas preventivas desde 900 litros.

El Reporte Certificaciones realiza un diagnóstico orientativo de preparación para ISO 14001, aplicación de la guía ISO 26000 y cumplimiento de la Ley REP. Distingue expresamente entre certificación, guía voluntaria y obligación legal, y no sustituye auditorías ni pronunciamientos de autoridad.

## Uso

1. Abra `index.html` en Chrome, Edge o Firefox.
2. Use los registros sintéticos para recorrer el dashboard.
3. Pulse **Limpiar demo** antes de ingresar información real.
4. Descargue respaldos periódicos desde **Datos y control**.

No requiere instalación ni conexión a internet. Los datos se almacenan en `localStorage` del navegador utilizado.

## Alcance de seguridad

- No envía información a servicios externos.
- La clasificación asistida funciona con reglas explicables.
- El borrador RETC no se transmite automáticamente.
- La descarga exige confirmar revisión humana e identificar al experto ambiental.

## Limitaciones del MVP

- No incorpora autenticación, perfiles de acceso ni base de datos centralizada.
- No sustituye la validación legal, sanitaria o ambiental.
- El índice normativo RAG y la integración con Power BI/RETC son componentes futuros.
- Para producción se recomienda API segura, PostgreSQL, control de acceso por roles, auditoría inmutable, cifrado, copias de seguridad y despliegue HTTPS.
