---
trigger: always_on
---

1. cuando hay una pagina, ejemplo /app/dashboard/page.tsx y hay componentes como modal de creacion y edicion. ese componente no se guarda en la carpeta global del proyecto /components, si no en carpeta /app/dashboard/components, si el modal es de esa page y asi con los demas.


2. Usar tanstack query para paginacion y filtros y para la mayoria de cosas, que requiera eso o actualizacion de datos, cuando se hace una operacion CRUD y demas, o search, etc.

3. Usar react hook form para los forms y shadcn forms para la ui y demas.

4. Para las fechas hacerlo de forma estandar usando UTC global y en la ui pasarla a local la fecha, usa el service, que tiene la mayoria de funciones necesaria para guardar fechas en db: /lib/date-service.ts, USER TANTO EN UI Y APIS para guardar datos en db, SIEMPRE USAR EL SERVICE.

5. Para money, sea mostrar o input, usa: money-input.tsx y money-display.tsx.

6. Para files, ya hay algo global y conectarlo con la tabla que necesita files, ModelAttachments.tsx  FileSelectorModal.tsx, puedes ver ejemplo de como se usa en /certificates, /licenses.

7. usar para tablas y demas shadcn siempre, para la ui.

8. Para storage y manejo de files y de todo tipo de files y urls de files, imagenes, etc., USAR SIEMPRE el service: storage-service.ts y files.ts. para asi tener todo centralizado. SIEMPRE USAR.