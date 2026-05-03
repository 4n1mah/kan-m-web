# Guía de uso — Kan M Admin

Bienvenida al panel de Kan M. Esta guía te explica cómo manejar pedidos, el catálogo, el calendario y los reportes desde el admin.

> **Tip rápido:** todo lo que se hace queda registrado con tu nombre. No tengas miedo de explorar — siempre se sabe quién hizo qué.

---

## 1. Iniciar sesión

1. Abre el sitio web en el celular o computadora.
2. Ve a `/admin/login` (o pídele el link al dueño del panel).
3. Pon tu correo y contraseña.
4. Si olvidas tu contraseña, pídele a la **dueña** del panel que te la restablezca desde "Gestión de usuarios". Te dará una nueva al instante.

Tu sesión dura **7 días**. Después de eso, vuelve a iniciar sesión.

---

## 2. Pantalla de inicio

Cuando entres verás:

- Un saludo: **"Hola, Karolyn 👋"**
- Cuántos pedidos tienes sin atender
- Cuatro tarjetas de resumen: Productos, Pedidos, Nuevos, Entregados
- Las pestañas de navegación: **Pedidos**, **Catálogo**, **Calendario**, **Reportes**

Arriba a la derecha está tu nombre y un menú con "Cerrar sesión".

---

## 3. Manejo de pedidos

### Las pestañas de pedidos

Cuando entra un pedido nuevo, va a **Nuevos**. Tu trabajo es moverlo por las etapas:

```
Nuevos → Activos → Listos → Entregados
                              o
                          Cancelados
```

| Pestaña | Qué pedidos hay |
|---------|-----------------|
| **Nuevos** | Pedidos que acaban de llegar y nadie ha revisado |
| **Activos** | Aceptados o pendientes de más información |
| **Listos** | Listos para entregar o que el cliente recoja |
| **Entregados** | Ya entregados — historial |
| **Cancelados** | Cancelados o rechazados — historial |

### Cuando llega un pedido nuevo

1. La pestaña **Nuevos** mostrará un número rojo con la cantidad. La pestaña del navegador también dirá `(N) Kan M Admin`.
2. Haz clic en el pedido para ver los detalles. Verás:
   - Datos del cliente (nombre, teléfono, correo)
   - Tipo de evento, fecha, hora, # de invitados
   - Productos solicitados (con detalles si es pastel)
   - Fotos de referencia
   - Notas del cliente
3. **Solo aparecen tres botones**:
   - **Aceptar** → te pide elegir quién lo va a hacer (Karolyn o Astrid). Pasa a "Activos".
   - **Más información** → si necesitas preguntarle algo al cliente antes. Pasa a "Activos" en el sub-estado "Más info". También elige repostera.
   - **Rechazar** → si no podemos hacerlo. Pasa a "Cancelados".

### Pedidos en "Activos"

Aquí ya puedes:
- Cambiar el **precio acordado** y la **anticipación recibida** (sección 💰)
- Marcar el **estado de pago**: Pendiente / Anticipación recibida / Pagado
- Agregar una **nota interna** (solo la ven las reposteras, no el cliente)
- Cambiar el **método de entrega** (delivery o recogida)
- Reasignar la repostera
- Editar cualquier dato del pedido
- Mandar **WhatsApp** al cliente con un mensaje pre-armado según el estado

Cuando el pedido está terminado, presiona **Marcar listo** (te pedirá confirmación). Pasa a "Listos".

### Pedidos en "Listos"

Cuando el cliente recoja o le llegue el delivery, presiona **Marcar entregado** (también te pedirá confirmación). Pasa a "Entregados".

### Botón de WhatsApp

Cuando le mandas WhatsApp al cliente, el mensaje cambia automáticamente según el estado:

| Estado del pedido | Mensaje predefinido |
|-------------------|---------------------|
| Listo (COMPLETED) | "...¿Nos puedes confirmar que toda la información está correcta?" |
| Más información (NEEDS_INFO) | "...Necesitaría más información para poder empezar a trabajar con su pedido, ¿tiene disponibilidad ahora?" |
| Rechazado (REJECTED) | "...Por el momento no trabajamos con este producto." |
| Otros estados | Mensaje libre con los detalles del pedido |

El mensaje incluye tu nombre como repostera. Solo presiona el botón verde de WhatsApp y se abre el chat con el mensaje listo. Tú puedes editarlo antes de enviarlo si quieres.

### Buscar y filtrar pedidos

- **Buscar** por nombre, teléfono o ID — funciona en todas las pestañas
- **Filtrar por repostera** (Todas / Sin asignar / nombre)
- Los pedidos urgentes (≤2 días para el evento) salen primero, en color naranja con un punto pulsante

---

## 4. Calendario

Tu mejor amigo si quieres ver el plan de trabajo del mes/semana/día.

### Tres vistas

- **Mes** — vista panorámica. Cada día muestra hasta 3 pedidos como chips con hora y nombre. "+N más" si hay más.
- **Semana** — 7 columnas de días con timeline horario. Los pedidos se posicionan según la hora.
- **Día** — un solo día con timeline detallado de 6am a 11pm. Línea rosa que indica "ahora" si es hoy.

Cambias entre vistas con el toggle (o presionando **M**, **W**, **D** en el teclado).

### Saltar a otro mes

- Las flechas ← → del header te avanzan/retroceden
- Hacer clic en el título del mes (ej: "Mayo De 2026") abre un selector rápido para saltar a cualquier mes/año
- "Ir a hoy" siempre te trae de vuelta
- Atajos de teclado: ← → para navegar, **T** para ir a hoy

### Ver detalles de un pedido desde el calendario

Haz clic en cualquier chip de pedido. Se abre un **panel lateral** con:
- Toda la información del pedido
- Si está urgente (≤2 días), aparece una banda naranja avisando
- Si no tiene repostera asignada, aparecen botones para asignar
- Acciones rápidas según el estado: Aceptar / Más info / Rechazar (si está nuevo), Marcar listo, Marcar entregado
- Botón de WhatsApp y "Ver completo" (te lleva al panel principal)

### Filtros

- Por repostera (Todas / Sin asignar / nombre)
- Por estado (Todos / Nuevo / Activo / etc.)
- Buscar por cliente
- "Ocultar cancelados / rechazados" si solo quieres ver los activos

### Indicadores visuales

- **Tinte rosa sutil** en días con muchos pedidos (heat map)
- **Punto pulsante** en días con pedidos urgentes
- **Hoy** siempre destacado con borde rosa
- Cada estado tiene su color (lee la leyenda al pie)

---

## 5. Catálogo

Donde gestionas los productos que aparecen en el sitio público.

### Agregar un producto

1. Pestaña **Catálogo** → **+ Agregar producto**
2. Llena: nombre, descripción, categoría, precio (opcional)
3. Sube una foto (sale a Cloudinary automáticamente)
4. Guardar

### Editar / Eliminar un producto

- Clic en cualquier producto para abrir el modal
- Editar todos los campos o cambiar la foto
- Botón rojo para eliminar (te pide confirmación)

### Categorías disponibles

- 🎂 Pasteles
- 🍰 Postres
- 🎉 Eventos
- 🍴 Picaderas
- 🥐 Brunch
- 🥤 Bebidas

---

## 6. Reportes

Pestaña con métricas:
- Pedidos por mes
- Productos más pedidos
- Distribución por estado
- Ingresos estimados (suma de precios acordados)

**Exportar CSV**: descarga todos los pedidos en un archivo Excel-friendly. Útil para contabilidad o respaldo.

---

## 7. Gestión de usuarios (solo Dueña)

Si tu rol es **OWNER**, verás "Gestión de usuarios" en el menú.

### Crear una nueva usuaria

1. Botón **+ Nueva usuaria**
2. Llena: nombre, correo, contraseña inicial (8+ caracteres), rol
3. Guardar
4. **Comparte la contraseña en privado** (WhatsApp o presencial)

### Cambiar el rol

Cada fila tiene un dropdown de rol. Cambia y se guarda al instante.

### Restablecer contraseña

Botón de la llave 🔑 al lado de la usuaria. Pones una contraseña nueva, ella la usa para entrar.

### Desactivar una usuaria

Botón del basurero 🗑. La usuaria queda **desactivada** (no se borra). No puede iniciar sesión, pero su historial se conserva.

Para reactivarla después, presiona el check ✓ verde.

### Roles

| Rol | Qué puede hacer |
|-----|-----------------|
| **Dueña (OWNER)** | Todo: pedidos, catálogo, reportes, gestión de usuarios |
| **Repostera (BAKER)** | Pedidos y catálogo. No administra usuarios. |
| **Asistente (ASSISTANT)** | Lee pedidos. Útil para empleados de apoyo. |

---

## 8. Bitácora de cambios

Cada acción que tú y las demás reposteras hacen queda guardada con:
- Tu nombre
- Fecha y hora exacta
- Qué cambió (de qué a qué)

Esto significa que si alguien dice "yo no fui", se puede ver. No es para vigilar — es para que cuando algo se rompa o se confunda, sepamos qué pasó.

(El historial se ve en cada pedido — sección "Historial de cambios".)

---

## 9. Atajos útiles

### En el calendario
- **M** — vista Mes
- **W** — vista Semana
- **D** — vista Día
- **T** — Ir a hoy
- **← →** — navegar
- **Esc** — cerrar panel lateral

### En el dashboard
- La pestaña del navegador muestra `(N)` con la cantidad de pedidos sin atender. Útil para tener el panel abierto en una pestaña secundaria.

### Notificaciones del navegador
La primera vez que entres, el navegador puede pedir permiso para mandarte notificaciones. Si lo aceptas, te avisará cuando lleguen pedidos nuevos.

---

## 10. ¿Algo no funciona?

- **No me deja entrar**: asegúrate de poner el correo exacto. Si no recuerdas la contraseña, pídele a la dueña que la restablezca.
- **Subí una foto y no aparece**: refresca la página. Si aún no aparece, prueba con otra imagen menor a 10MB.
- **El estado no se guarda**: revisa tu conexión. Si el problema persiste, cierra sesión y vuelve a entrar.
- **Estoy viendo datos viejos**: el panel se actualiza automáticamente cada minuto, pero puedes refrescar con F5 si quieres ver los cambios al toque.

Cualquier problema técnico, contacta a **Sadiel** (desarrollador).

---

¡Buen trabajo! 🎂✨
