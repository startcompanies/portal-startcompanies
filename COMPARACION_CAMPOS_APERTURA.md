# Comparación de Campos: Formulario Real vs Implementado

## Formulario Real de Zoho (según imágenes proporcionadas)

### Paso 1: Información de la LLC
- **Tipo** (campo de texto)
- **Nombre de la LLC - Opción 1** * (requerido)
- **Nombre de la LLC - Opción 2** * (requerido)
- **Nombre de la LLC - Opción 3** * (requerido)
- **Estado de Registro de la LLC** * (dropdown)
- **Actividad Principal de la LLC** * (requerido)
- **Estructura Societaria** * (dropdown: Single Member LLC / Multi Member LLC)
- **LinkedIn** (opcional)

### Paso 2: Información del Propietario/Socios
- **Información del Propietario** (botón para agregar)
- **Información de los propietarios** (botón para agregar nuevo socio)

**Campos del Propietario/Socio:**
- **Nombres** *
- **Apellidos** *
- **Número Pasaporte Completo** *
- **Pasaporte escaneado** * (archivo)
- **Nacionalidad** * (dropdown)
- **Fecha de nacimiento** (NO requerido)
- **Correo electrónico** *
- **Teléfono de contacto** *
- **Porcentaje de participación** *
- **Dirección Completa** *:
  - Calle y número exterior/altura
  - Número interior/departamento
  - Ciudad
  - Estado/Región/Provincia
  - Código postal
  - País de Residencia (dropdown)

### Paso 3: Información para Apertura Bancaria
- **Factura de Servicio (Prueba de Dirección)** * (archivo)
- **Resumen Bancario** * (archivo)
- **¿Tendrá ingresos periódicos que suman USD 10,000 o más en los próximos tres meses?** (Si/No - radio buttons)
- **Correo Electrónico Vinculado a la Cuenta Bancaria** *
- **Número de Teléfono Vinculado a la Cuenta Bancaria** *
- **Actividad financiera esperada** *
- **URL del Proyecto o Empresa** (Opcional)

### Paso 4: Declaraciones y Firmas
- **Confirmación de Veracidad y Firma Electrónica** * (textarea con texto de aceptación)

---

## Formulario Implementado Actualmente

### Información Básica de la LLC
- ✅ Tipo de LLC (dropdown)
- ✅ Estado de Constitución (dropdown)
- ✅ Nombre de la LLC (Principal) *
- ✅ Nombre de la LLC - Opción 2
- ✅ Nombre de la LLC - Opción 3
- ✅ Actividad Principal de la LLC
- ✅ LinkedIn
- ❌ **EXTRA:** Teléfono de la LLC (NO está en el formulario real)
- ❌ **EXTRA:** Correo Electrónico de la LLC (NO está en el formulario real)
- ❌ **EXTRA:** Página Web (NO está en el formulario real)
- ❌ **EXTRA:** Fecha de Constitución (NO está en el formulario real)
- ❌ **EXTRA:** Ingresos Anuales (USD) (NO está en el formulario real)

### EIN
- ✅ ¿Tiene EIN? (checkbox)
- ✅ Número de EIN
- ✅ Documento EIN (archivo)
- ✅ Razón si no tiene EIN
- ⚠️ **NOTA:** En el formulario real NO aparece la sección EIN en el Paso 1

### Registered Agent
- ✅ Nombre del Agente Registrado
- ✅ Tipo de Agente
- ✅ Email del Agente
- ✅ Teléfono del Agente
- ✅ Dirección del Agente Registrado
- ⚠️ **NOTA:** En el formulario real NO aparece Registered Agent en el Paso 1

### Información de Cuenta Bancaria
- ✅ ¿Necesita ayuda con verificación bancaria? (checkbox)
- ✅ Tipo de Cuenta Bancaria
- ✅ Nombre del Banco
- ✅ Número de Cuenta
- ✅ Número de Ruta
- ✅ Extracto Bancario (archivo)
- ❌ **FALTA:** Factura de Servicio (Prueba de Dirección) * (archivo)
- ❌ **FALTA:** ¿Tendrá ingresos periódicos que suman USD 10,000 o más? (radio buttons Si/No)
- ❌ **FALTA:** Correo Electrónico Vinculado a la Cuenta Bancaria *
- ❌ **FALTA:** Número de Teléfono Vinculado a la Cuenta Bancaria *
- ❌ **FALTA:** URL del Proyecto o Empresa (Opcional)

### Dirección Personal del Propietario
- ✅ Nacionalidad
- ✅ País de Residencia
- ✅ Teléfono
- ✅ Email
- ✅ Dirección Personal
- ⚠️ **NOTA:** En el formulario real, esta información está dentro de "Información del Propietario" en el Paso 2, no como sección separada

### Preguntas Fiscales/Tributarias
- ✅ ¿Almacena productos en un depósito en EE.UU.?
- ✅ ¿La LLC declaró impuestos anteriormente?
- ✅ ¿La LLC se constituyó con Start Companies?
- ✅ ¿Los ingresos brutos o activos superan $250,000?
- ✅ ¿Posee la LLC inversiones o activos en EE.UU.?
- ✅ ¿Tendrá ingresos periódicos que sumen USD 10,000?
- ✅ ¿Tu empresa contrata servicios en EE.UU.?
- ✅ ¿Tu empresa posee o renta una propiedad en EE.UU.?
- ✅ ¿Tu LLC tiene cuentas bancarias a su nombre?
- ✅ Actividad Financiera Esperada
- ⚠️ **NOTA:** En el formulario real, estas preguntas NO aparecen en el Paso 1, algunas están en el Paso 3

### Socios/Miembros de la LLC
- ✅ Nombres *
- ✅ Apellidos *
- ✅ Número de Pasaporte *
- ✅ Nacionalidad *
- ✅ Fecha de Nacimiento *
- ✅ Email *
- ✅ Teléfono *
- ✅ % de Participación *
- ✅ Dirección del Miembro *
- ❌ **FALTA:** Pasaporte escaneado * (archivo) - En el formulario real SÍ está
- ⚠️ **DIFERENCIA:** En el formulario real, la dirección tiene campos diferentes:
  - Calle y número exterior/altura
  - Número interior/departamento
  - Ciudad
  - Estado/Región/Provincia
  - Código postal
  - País de Residencia (dropdown)

### Documentos
- ✅ Certificado de Formación (archivo)
- ⚠️ **NOTA:** En el formulario real, los documentos están en el Paso 3 (Factura de Servicio, Resumen Bancario)

### Paso 4: Declaraciones
- ❌ **FALTA COMPLETAMENTE:** Paso 4 con "Confirmación de Veracidad y Firma Electrónica" *

---

## Resumen de Diferencias Principales

### Campos que NO deberían estar (están en el implementado pero NO en el real):
1. Teléfono de la LLC
2. Correo Electrónico de la LLC
3. Página Web
4. Fecha de Constitución
5. Ingresos Anuales (USD)
6. Sección EIN completa (en Paso 1)
7. Sección Registered Agent completa (en Paso 1)
8. Sección "Información de Cuenta Bancaria" con campos de banco (Nombre del Banco, Número de Cuenta, Número de Ruta)
9. Sección "Dirección Personal del Propietario" separada
10. Sección "Preguntas Fiscales/Tributarias" en Paso 1

### Campos que FALTAN (están en el real pero NO en el implementado):
1. **Paso 3:** Factura de Servicio (Prueba de Dirección) * (archivo)
2. **Paso 3:** ¿Tendrá ingresos periódicos que suman USD 10,000 o más? (radio buttons)
3. **Paso 3:** Correo Electrónico Vinculado a la Cuenta Bancaria *
4. **Paso 3:** Número de Teléfono Vinculado a la Cuenta Bancaria *
5. **Paso 3:** URL del Proyecto o Empresa (Opcional)
6. **Paso 2 (Miembros):** Pasaporte escaneado * (archivo)
7. **Paso 4:** Confirmación de Veracidad y Firma Electrónica * (textarea)

### Estructura de Pasos Diferente:
- **Real:** 4 pasos (Información LLC → Propietarios/Socios → Apertura Bancaria → Declaraciones)
- **Implementado:** 3 pasos (Tipo Servicio → Datos Servicio → Pago) - pero los datos del servicio están todos mezclados en un solo paso

### Orden y Agrupación Diferente:
- En el formulario real, los campos están organizados en pasos específicos
- En el implementado, todos los campos están en un solo paso (Paso 3: Datos del Servicio)
