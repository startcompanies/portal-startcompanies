# Análisis de Endpoints Backend para el Panel

## 📋 Resumen Ejecutivo

Este documento analiza el panel frontend desarrollado y define los endpoints del backend necesarios para soportar todas las funcionalidades. Se considera que el blog ya está manejado por otro aplicativo, por lo que los módulos de `posts`, `categories`, `tags` y `reusable-elements` no se modificarán.

### ⚠️ Aspectos Clave de las Solicitudes

El sistema maneja **3 tipos de servicios**, cada uno con campos y documentación específica:

1. **Apertura LLC** (`apertura-llc`)
   - Variantes: Single Member y Multi Member
   - Campos requeridos: `llcType`, `llcName`, `state`
   - Documentación diferente según el tipo de LLC

2. **Renovación LLC** (`renovacion-llc`)
   - Variantes: Single Member y Multi Member
   - Campos requeridos: `llcType`, `existingLLCNumber`, `existingLLCName`, `existingState`
   - Documentación diferente según el tipo de LLC

3. **Cuenta Bancaria** (`cuenta-bancaria`)
   - Variantes: Single Member y Multi Member
   - 7 pasos del formulario
   - Subformulario específico para el miembro validador de la cuenta
   - Integración con sistema Relay para autenticación
   - Documentación específica: certificados, operating agreement, comprobantes, identificación, fotografías

**Importante:** Cada tipo de solicitud tiene una lista de documentos requeridos que varía según:
- El tipo de servicio
- El tipo de LLC (single/multi) - solo para apertura y renovación
- Algunos documentos son obligatorios, otros opcionales

Ver sección **"Tipos de Servicios y Campos Requeridos"** para detalles completos.

---

## 🔍 Análisis del Frontend del Panel

### Funcionalidades Identificadas

#### 1. **Autenticación y Usuarios**
- Login (`/panel/login`)
- Registro (`/panel/register`)
- Recuperación de contraseña (`/panel/reset-password`)
- Cambio de contraseña (Settings)
- Gestión de perfil (Settings)

#### 2. **Dashboard y Solicitudes**
- Dashboard de cliente/partner (`/panel/client-dashboard`)
- Listado de solicitudes propias (`/panel/my-requests`)
- Detalle de solicitud (`/panel/my-requests/:id`)
- Crear nueva solicitud (`/panel/new-request`) - Solo partners
- Listado de solicitudes (Admin) (`/panel/requests`)
- Detalle de solicitud (Admin) (`/panel/requests/:id`)

#### 3. **Gestión de Clientes**
- Listado de clientes (Admin) (`/panel/clients`)
- Listado de mis clientes (Partner) (`/panel/my-clients`)
- Crear cliente
- Activar/Desactivar cliente

#### 4. **Gestión de Partners**
- Listado de partners (Admin) (`/panel/partners`)
- Detalle de partner (`/panel/partners/:id`)
- Crear partner
- Activar/Desactivar partner
- Reportes de partners (`/panel/partner-reports`)

#### 5. **Documentos**
- Subir documentos asociados a solicitud
- Listar documentos de una solicitud
- Descargar documentos
- Eliminar documentos

#### 6. **Notificaciones**
- Listar notificaciones del usuario
- Marcar notificación como leída
- Marcar todas como leídas
- Eliminar notificación
- Contador de no leídas

#### 7. **Configuración**
- Actualizar perfil de usuario
- Preferencias de usuario (idioma, tema, notificaciones)
- Cambio de contraseña
- Configuración de procesos (Admin)

---

## 🗄️ Análisis del Backend Actual

### Módulos Existentes (No Modificar - Blog)
- ✅ `posts` - Gestión de posts del blog
- ✅ `categories` - Categorías del blog
- ✅ `tags` - Tags del blog
- ✅ `reusable-elements` - Elementos reutilizables del blog

### Módulos Existentes (Reutilizables)
- ✅ `auth` - Autenticación básica (signin, signup, change-password)
- ✅ `user` - Gestión básica de usuarios (findAll, findById, update)
- ✅ `upload-file` - Subida de archivos a S3
- ✅ `common` - Utilidades comunes (paginación, interceptors)

### Entidades Existentes

#### User Entity
```typescript
{
  id: number;
  username: string;
  password?: string;
  email: string;
  status: boolean;
  type: string; // 'user' por defecto - necesita ser 'client' | 'partner' | 'admin'
  first_name: string;
  last_name: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Cambios Necesarios:**
- El campo `type` debe soportar valores: `'client' | 'partner' | 'admin'`
- Agregar campos opcionales: `phone`, `company`
- La relación con `Post` puede mantenerse para el blog, pero no afecta al panel

---

## 📡 Endpoints Necesarios

### 1. Autenticación (`/auth`)

#### ✅ Existentes (Solo ajustes menores)
- `POST /auth/signin` - ✅ Existe
- `POST /auth/signup` - ✅ Existe (necesita validar tipo de usuario)
- `POST /auth/change-password` - ✅ Existe

#### 🔨 Nuevos Endpoints Necesarios
- `POST /auth/forgot-password` - Enviar email de recuperación
- `POST /auth/reset-password` - Resetear contraseña con token

---

### 2. Usuarios (`/users`)

#### ✅ Existentes (Ajustes necesarios)
- `GET /users` - ✅ Existe (filtrar por tipo si es necesario)
- `GET /users/:id` - ✅ Existe
- `PATCH /users/:id` - ✅ Existe (necesita validar campos nuevos: phone, company)

#### 🔨 Nuevos Endpoints Necesarios
- `GET /users/me` - Obtener usuario actual autenticado
- `GET /users/partners` - Listar solo partners (para admin)
- `GET /users/clients` - Listar solo clientes (para admin)
- `GET /users/my-clients` - Listar clientes del partner actual (para partner)
- `PATCH /users/me` - Actualizar perfil del usuario actual
- `PATCH /users/:id/status` - Activar/Desactivar usuario (admin)

---

### 3. Solicitudes/Requests (`/requests`) - ⚠️ NUEVO MÓDULO COMPLETO

Este es el módulo más importante y completamente nuevo. Necesita:

#### Entidad Request (Base)
```typescript
{
  id: number;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  status: 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  clientId: number; // FK a User
  partnerId?: number; // FK a User (opcional, si viene de partner)
  currentStepId?: number; // FK a ProcessStep
  currentStepNumber?: number; // Paso actual del formulario (validado en tabla específica)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones 1:1 con tablas específicas (solo una estará presente según type)
  aperturaLlcRequest?: AperturaLlcRequest;
  renovacionLlcRequest?: RenovacionLlcRequest;
  cuentaBancariaRequest?: CuentaBancariaRequest;
}
```

#### Entidad AperturaLlcRequest
```typescript
{
  requestId: number; // FK a Request (PK)
  currentStepNumber: number; // 1-6
  
  // Paso 1: Información de la LLC
  llcName?: string;
  businessType?: string;
  businessDescription?: string;
  llcPhoneNumber?: string;
  llcWebsite?: string;
  llcEmail?: string;
  incorporationState?: string;
  incorporationDate?: Date;
  hasEin?: boolean;
  einNumber?: string;
  einDocumentUrl?: string;
  noEinReason?: string;
  certificateOfFormationUrl?: string;
  
  // Paso 2: Dirección del Registered Agent
  registeredAgentAddress?: {
    street: string;
    building?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  registeredAgentName?: string;
  registeredAgentEmail?: string;
  registeredAgentPhone?: string;
  registeredAgentType?: 'persona' | 'empresa';
  
  // Paso 3: Información de la cuenta bancaria
  needsBankVerificationHelp?: boolean;
  bankAccountType?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankStatementUrl?: string;
  
  // Paso 4: Dirección Personal del Propietario
  ownerNationality?: string;
  ownerCountryOfResidence?: string;
  ownerPersonalAddress?: {
    street: string;
    building?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  ownerPhoneNumber?: string;
  ownerEmail?: string;
  
  // Paso 5: Tipo de LLC
  llcType?: 'single' | 'multi';
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entidad RenovacionLlcRequest
```typescript
{
  requestId: number; // FK a Request (PK)
  currentStepNumber: number; // 1-6
  
  // Paso 1: Datos Generales de la LLC
  llcName?: string;
  societyType?: string;
  registrationNumber?: string;
  state?: string;
  hasDataOrDirectorsChanges?: boolean;
  physicalAddress?: string;
  correspondenceAddress?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  mainActivityDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  hasEin?: boolean;
  einNumber?: string;
  mainActivity?: string;
  responsiblePerson?: {
    name: string;
    lastName: string;
    country: string;
    address: string;
    email: string;
    phone: string;
  };
  wantsRegisteredAgent?: boolean;
  registeredAgentInfo?: {
    name: string;
    address: string;
    country: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  identityDocumentUrl?: string;
  proofOfAddressUrl?: string;
  llcContractOrOperatingAgreementUrl?: string;
  articlesOfIncorporationUrl?: string;
  
  // Paso 3: Domicilio Registrado
  registeredAddress?: string;
  registeredCountry?: string;
  registeredState?: string;
  registeredCity?: string;
  registeredPostalCode?: string;
  
  // Paso 4: Documentación Anexa
  capitalContributionsUrl?: string;
  stateRegistrationUrl?: string;
  certificateOfGoodStandingUrl?: string;
  
  // Paso 5: Confirmación de Datos
  dataIsCorrect?: boolean;
  observations?: string;
  
  // Paso 6: Pago y Envío
  paymentMethod?: string;
  amountToPay?: number;
  wantsInvoice?: boolean;
  paymentProofUrl?: string;
  
  // Tipo de LLC
  llcType?: 'single' | 'multi';
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entidad CuentaBancariaRequest
```typescript
{
  requestId: number; // FK a Request (PK)
  currentStepNumber: number; // 1-7
  
  // Paso 1: Información del Solicitante
  applicantEmail?: string;
  applicantFirstName?: string;
  applicantPaternalLastName?: string;
  applicantMaternalLastName?: string;
  applicantPhone?: string;
  accountType?: string;
  businessType?: string;
  legalBusinessIdentifier?: string;
  industry?: string;
  economicActivity?: string; // Máx 200 caracteres
  ein?: string;
  certificateOfConstitutionOrArticlesUrl?: string;
  operatingAgreementUrl?: string;
  
  // Paso 2: Dirección del Registro
  companyAddress?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isRegisteredAgentInUSA?: boolean;
  registeredAgentName?: string;
  registeredAgentAddress?: string;
  
  // Paso 3: Información de la cuenta bancaria
  bankName?: string;
  swiftBicAba?: string;
  accountNumber?: string;
  bankAccountType?: string;
  firstRegistrationDate?: Date;
  hasLitigatedCurrentFiscalYear?: boolean;
  litigationDetails?: string;
  
  // Paso 4: Dirección Personal del Propietario
  isSameAddressAsBusiness?: boolean;
  ownerPersonalAddress?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  proofOfAddressUrl?: string;
  
  // Paso 5: Tipo de LLC
  llcType?: 'single' | 'multi';
  
  // Paso 7: Confirmación y Firma Electrónica
  documentCertification?: string;
  acceptsTermsAndConditions?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
  
  // ===== CAMPOS ESPECÍFICOS PARA APERTURA LLC =====
  
  // Paso 1: Información de la LLC
  llcName?: string;
  businessType?: string;
  businessDescription?: string;
  llcPhoneNumber?: string; // Formato: "+1 (___) ___-____"
  llcWebsite?: string; // Opcional
  llcEmail?: string;
  incorporationState?: string; // Estado de incorporación
  incorporationDate?: Date; // Fecha de incorporación
  hasEin?: boolean; // ¿La LLC ha obtenido un EIN?
  einNumber?: string; // Si hasEin === true
  einDocumentUrl?: string; // URL del documento EIN subido
  noEinReason?: string; // Si hasEin === false
  certificateOfFormationUrl?: string; // URL del certificado de formación
  
  // Paso 2: Dirección del Registered Agent
  registeredAgentAddress?: {
    street: string;
    building?: string; // Opcional
    city: string;
    state: string;
    postalCode: string;
    country: string; // Default: "United States"
  };
  registeredAgentName?: string;
  registeredAgentEmail?: string;
  registeredAgentPhone?: string; // Formato: "+1 (___) ___-____"
  registeredAgentType?: 'persona' | 'empresa'; // Persona o Empresa en EE. UU.
  
  // Paso 3: Información de la cuenta bancaria
  needsBankVerificationHelp?: boolean;
  bankAccountType?: string; // Si needsBankVerificationHelp === true
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankStatementUrl?: string; // URL del extracto bancario
  
  // Paso 4: Dirección Personal del Propietario
  ownerNationality?: string;
  ownerCountryOfResidence?: string;
  ownerPersonalAddress?: {
    street: string;
    building?: string; // Opcional
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  ownerPhoneNumber?: string; // Formato: "+1 (___) ___-____"
  ownerEmail?: string;
  
  // Paso 5: Tipo de LLC
  llcType?: 'single' | 'multi'; // Single Member o Multi-Member
  
  // Paso 6: Información de los Miembros (relación OneToMany con Member)
  members?: Member[]; // Array de miembros/propietarios
  
  // ===== CAMPOS ESPECÍFICOS PARA RENOVACIÓN LLC =====
  
  // Paso 1: Datos Generales de la LLC
  societyType?: string; // Pre-llenado: "LLC (Limited Liability Company)"
  registrationNumber?: string; // Número de registro
  hasDataOrDirectorsChanges?: boolean; // ¿La LLC ha realizado cambios?
  physicalAddress?: string; // Dirección física
  correspondenceAddress?: string; // Dirección de correspondencia
  mainActivityDescription?: string; // Descripción de actividad principal
  hasEin?: boolean; // ¿La LLC cuenta con un EIN?
  einNumber?: string; // Si hasEin === true
  mainActivity?: string; // Actividad principal si hasEin === true
  responsiblePerson?: { // Si hasEin === false
    name: string;
    lastName: string;
    country: string;
    address: string;
    email: string;
    phone: string;
  };
  wantsRegisteredAgent?: boolean; // ¿Deseas agregar un Agente Registrado?
  registeredAgentInfo?: { // Si wantsRegisteredAgent === true
    name: string;
    address: string;
    country: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  identityDocumentUrl?: string; // Documento de identidad
  proofOfAddressUrl?: string; // Proof of address
  llcContractOrOperatingAgreementUrl?: string; // Contrato o Operating Agreement
  articlesOfIncorporationUrl?: string; // Acta de Constitución
  
  // Paso 3: Domicilio Registrado
  registeredAddress?: string;
  registeredCountry?: string;
  registeredState?: string;
  registeredCity?: string;
  registeredPostalCode?: string;
  
  // Paso 4: Documentación Anexa
  capitalContributionsUrl?: string; // Aportaciones de Capital (PDF)
  stateRegistrationUrl?: string; // Registro del Estado (PDF)
  certificateOfGoodStandingUrl?: string; // Certificado de Buena Reputación (PDF)
  
  // Paso 5: Confirmación de Datos
  dataIsCorrect?: boolean; // ¿Los datos proporcionados son correctos?
  observations?: string; // Observaciones
  
  // Paso 6: Pago y Envío
  paymentMethod?: string; // Método de pago
  amountToPay?: number; // Monto a pagar (ej: 150.00)
  wantsInvoice?: boolean; // ¿Deseas facturar?
  paymentProofUrl?: string; // Comprobante de pago
  
  // ===== CAMPOS ESPECÍFICOS PARA CUENTA BANCARIA =====
  
  // Paso 1: Información del Solicitante
  applicantEmail?: string;
  applicantFirstName?: string;
  applicantPaternalLastName?: string;
  applicantMaternalLastName?: string;
  applicantPhone?: string;
  accountType?: string; // Tipo de cuenta
  businessType?: string; // Tipo de negocio
  legalBusinessIdentifier?: string; // Identificador legal de negocio
  industry?: string; // Industria / Rubro
  economicActivity?: string; // Actividad económica (máx 200 caracteres)
  ein?: string; // EIN de la LLC
  certificateOfConstitutionOrArticlesUrl?: string; // Certificado de Constitución o Artículos
  operatingAgreementUrl?: string; // Operating Agreement
  
  // Paso 2: Dirección del Registro
  companyAddress?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string; // Default: "Estados Unidos"
  };
  isRegisteredAgentInUSA?: boolean; // ¿Es el Registered Agent en USA?
  registeredAgentName?: string;
  registeredAgentAddress?: string; // Textarea
  
  // Paso 3: Información de la cuenta bancaria
  bankName?: string; // Banco seleccionado de lista
  swiftBicAba?: string; // SWIFT / BIC / ABA
  accountNumber?: string; // Número de Cuenta
  bankAccountType?: string; // Tipo de Cuenta
  firstRegistrationDate?: Date; // Fecha de registro por primera vez
  hasLitigatedCurrentFiscalYear?: boolean; // ¿Has litigado en el año fiscal actual?
  litigationDetails?: string; // Si hasLitigatedCurrentFiscalYear === true
  
  // Paso 4: Dirección Personal del Propietario
  isSameAddressAsBusiness?: boolean; // ¿Es la misma dirección que tu negocio?
  ownerPersonalAddress?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string; // Default: "Estados Unidos"
  };
  proofOfAddressUrl?: string; // Comprobante de domicilio (no mayor a 3 meses)
  
  // Paso 5: Tipo de LLC (ya definido arriba como llcType)
  
  // Paso 6: Identificación de Propietarios (relación OneToMany con Member)
  owners?: Member[]; // Array de propietarios
  
  // Paso 7: Confirmación y Firma Electrónica
  documentCertification?: string; // Certificación de los documentos enviados
  acceptsTermsAndConditions?: boolean; // Acepto los Términos y Condiciones
  
  // Miembro Validador (subformulario)
  bankAccountValidator?: BankAccountValidator; // Relación OneToOne con el miembro validador
}
```

#### Entidad Member (para Multi-Member LLC y Renovación)
```typescript
{
  id: number;
  requestId: number; // FK a Request
  firstName: string;
  lastName: string;
  passportNumber: string; // Número completo de pasaporte
  nationality: string;
  scannedPassportUrl?: string; // URL del pasaporte escaneado (opcional en renovación)
  dateOfBirth: Date; // Formato: dd-MMM-yyyy
  email: string;
  phoneNumber: string;
  memberAddress: {
    street: string;
    unit?: string; // Número interior/departamento
    city: string;
    stateRegion: string; // Estado/Región/Provincia
    postalCode: string;
    country: string; // País de residencia
  };
  percentageOfParticipation: number; // 0-100, debe sumar 100% entre todos
  validatesBankAccount?: boolean; // Solo uno por LLC puede ser true (solo para apertura)
  additionalBankDocsUrl?: string; // Si validatesBankAccount === true
  
  // Campos adicionales para Renovación LLC
  ssnOrItin?: string; // Número de SSN/ITIN (opcional)
  nationalTaxId?: string; // ID Fiscal Nacional (CUIT, etc.)
  taxFilingCountry?: string; // País bajo cuyas leyes presenta impuestos
  ownerContributions2024?: number; // Aportes del Propietario en 2024 (USD)
  ownerLoansToLLC2024?: number; // Préstamos del Propietario a la LLC en 2024 (USD)
  loansReimbursedByLLC2024?: number; // Préstamos Reembolsados por la LLC en 2024 (USD)
  profitDistributions2024?: number; // Distribuciones de ganancias en 2024 (USD)
  spentMoreThan31DaysInUS?: string; // ¿Pasó más de 31 días en EE. UU.?
  hasUSFinancialInvestments?: string; // ¿Posee inversiones/activos en EE. UU.?
  isUSCitizen?: string; // ¿Es ciudadano de EE. UU.?
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entidad BankAccountValidator (Miembro que validará la cuenta bancaria)
```typescript
{
  id: number;
  requestId: number; // FK a Request (OneToOne)
  firstName: string;
  lastName: string;
  dateOfBirth: Date; // Formato: dd-MMM-yyyy
  nationality: string;
  citizenship: string;
  passportNumber: string; // Como figura en el pasaporte, incluye letras y números
  scannedPassportUrl: string; // Pasaporte escaneado (debe estar vigente)
  workEmail: string; // Email laboral
  useEmailForRelayLogin: boolean; // Este correo se usará para ingresar a Relay
  phone: string; // Teléfono
  canReceiveSMS: boolean; // Debe tener capacidad para recibir SMS
  isUSResident: boolean; // ¿Es residente en EE.UU.?
  createdAt: Date;
  updatedAt: Date;
}
```

#### Tipos de Servicios y Campos Requeridos

##### 1. Apertura LLC (`apertura-llc`)

El formulario de Apertura LLC consta de **6 pasos** que deben completarse secuencialmente:

**PASO 1: Información de la LLC**

**Campos Requeridos:**
- `llcName`: Nombre de la LLC (REQUERIDO)
- `businessType`: Tipo de Negocio (REQUERIDO)
- `businessDescription`: Descripción del Negocio (REQUERIDO)
- `llcPhoneNumber`: Número de Teléfono de la LLC (REQUERIDO) - Formato: "+1 (___) ___-____"
- `llcEmail`: Correo Electrónico de la LLC (REQUERIDO)
- `incorporationState`: Estado de Incorporación (REQUERIDO) - Dropdown
- `incorporationDate`: Fecha de Incorporación (REQUERIDO) - Formato: MM/DD/YYYY
- `hasEin`: ¿La LLC ha obtenido un EIN? (REQUERIDO) - Radio: "Sí" | "No"
  - Si `hasEin === true`:
    - `einNumber`: Número de EIN (REQUERIDO)
    - `einDocument`: Cargar Documento EIN (REQUERIDO) - PDF, máx 5MB
  - Si `hasEin === false`:
    - `noEinReason`: Motivo por el que no tiene EIN (OPCIONAL)
- `certificateOfFormation`: Certificado de Formación de la LLC (REQUERIDO) - PDF, máx 10MB

**Campos Opcionales:**
- `llcWebsite`: Sitio Web de la LLC - URL válida

---

**PASO 2: Dirección del Registered Agent**

**Campos Requeridos:**
- `registeredAgentAddress`: Dirección de la empresa (REQUERIDO)
  - `street`: Calle y Número (REQUERIDO)
  - `building`: Edificio/Apartamento/Suite (OPCIONAL)
  - `city`: Ciudad (REQUERIDO)
  - `state`: Estado / Provincia (REQUERIDO) - Dropdown
  - `postalCode`: Código Postal (REQUERIDO)
  - `country`: País (REQUERIDO) - Dropdown, default: "United States"
- `registeredAgentName`: Nombre del Registered Agent (REQUERIDO)
- `registeredAgentEmail`: Correo Electrónico del Registered Agent (REQUERIDO)
- `registeredAgentPhone`: Número de Teléfono del Registered Agent (REQUERIDO) - Formato: "+1 (___) ___-____"
- `registeredAgentType`: ¿Es el Registered Agent una persona o empresa en EE. UU.? (REQUERIDO) - Radio: "Persona" | "Empresa"

---

**PASO 3: Información de la cuenta bancaria**

**Campos Requeridos:**
- `needsBankVerificationHelp`: ¿Necesitas ayuda para verificar tu cuenta bancaria? (REQUERIDO) - Radio: "Sí" | "No"
  - Si `needsBankVerificationHelp === true`:
    - `bankAccountType`: Tipo de cuenta bancaria (REQUERIDO) - Dropdown
    - `bankName`: Nombre del banco (REQUERIDO)
    - `bankAccountNumber`: Número de cuenta bancaria (REQUERIDO)
    - `bankRoutingNumber`: Número de ruta del banco (REQUERIDO)
    - `bankStatement`: Extracto bancario más reciente (REQUERIDO) - PDF, máx 5MB

---

**PASO 4: Dirección Personal del Propietario**

**Campos Requeridos:**
- `ownerNationality`: Nacionalidad del Propietario (REQUERIDO) - Dropdown
- `ownerCountryOfResidence`: País de Residencia del Propietario (REQUERIDO) - Dropdown
- `ownerPersonalAddress`: Dirección Personal (REQUERIDO)
  - `street`: Calle y Número (REQUERIDO)
  - `building`: Edificio/Apartamento/Suite (OPCIONAL)
  - `city`: Ciudad (REQUERIDO)
  - `state`: Estado / Provincia (REQUERIDO) - Dropdown
  - `postalCode`: Código Postal (REQUERIDO)
  - `country`: País (REQUERIDO) - Dropdown
- `ownerPhoneNumber`: Número de Teléfono Personal (REQUERIDO) - Formato: "+1 (___) ___-____"
- `ownerEmail`: Correo Electrónico Personal (REQUERIDO)

---

**PASO 5: Tipo de LLC**

**Campos Requeridos:**
- `llcType`: Tipo de LLC (REQUERIDO) - Radio:
  - "LLC de Un Solo Miembro (Single Member LLC)"
  - "LLC de Varios Miembros (Multi-Member LLC)"

**Nota:** Este paso determina si se requiere información de un solo propietario o múltiples propietarios en el siguiente paso.

---

**PASO 6: Información de los Miembros**

Este paso varía según el tipo de LLC seleccionado en el Paso 5:

**Para Single Member LLC:**
- Se puede usar la información del propietario del Paso 4, o solicitar información adicional del miembro único.

**Para Multi-Member LLC:**
- Se debe recopilar información de **todos los miembros/propietarios**. Cada miembro requiere:

**Campos Requeridos por Miembro:**
- `firstName`: Nombres (REQUERIDO)
- `lastName`: Apellidos (REQUERIDO)
- `passportNumber`: Número Pasaporte Completo (REQUERIDO) - Ejemplo: "A1234567, AB1234567, 123456789"
- `nationality`: Nacionalidad (REQUERIDO) - Dropdown
- `scannedPassport`: Pasaporte escaneado (REQUERIDO) - JPG, PNG, PDF, máx 5MB
- `dateOfBirth`: Fecha de nacimiento (REQUERIDO) - Formato: dd-MMM-yyyy
- `email`: Correo electrónico (REQUERIDO)
- `phoneNumber`: Teléfono de contacto (REQUERIDO)
- `memberAddress`: Dirección Completa del Miembro (REQUERIDO)
  - `street`: Calle y número exterior/altura (REQUERIDO) - Ejemplo: "Av. Libertador 1234"
  - `unit`: Número interior/departamento (OPCIONAL) - Ejemplo: "Piso 2, Oficina 105"
  - `city`: Ciudad (REQUERIDO) - Ejemplo: "Madrid"
  - `stateRegion`: Estado/Región/Provincia (REQUERIDO) - Ejemplo: "Florida, CDMX, Buenos Aires"
  - `postalCode`: Código postal (REQUERIDO) - Ejemplo: "10001"
  - `country`: País de Residencia (REQUERIDO) - Dropdown
- `percentageOfParticipation`: Porcentaje de participación (REQUERIDO) - Número, rango 0-100, con símbolo "%"
- `validatesBankAccount`: ¿Validará este propietario la cuenta bancaria? (REQUERIDO) - Radio: "Sí" | "No"
  - **Regla de negocio:** Solo se permite un propietario por LLC que valide la cuenta bancaria
  - Si `validatesBankAccount === true`:
    - `additionalBankDocs`: Documentación adicional para validación bancaria (REQUERIDO) - Archivos adicionales

**Validaciones de Negocio:**
- La suma de `percentageOfParticipation` de todos los miembros debe ser igual a 100%
- Solo un miembro puede tener `validatesBankAccount === true` (validado con índice único en BD)
- Si es Single Member LLC, solo debe haber un miembro en la lista
- Si `hasEin === true`, entonces `einNumber` y `einDocument` son requeridos
- Si `hasEin === false`, `noEinReason` es opcional
- Si `needsBankVerificationHelp === true`, entonces todos los campos bancarios son requeridos
- Si `llcType === 'multi'`, entonces `members` debe tener al menos 2 miembros
- Si `llcType === 'single'`, entonces `members` debe tener exactamente 1 miembro (o usar datos del propietario del Paso 4)

**Guardado Parcial por Pasos:**
El formulario permite guardar el progreso por pasos. El backend debe:
- Aceptar `currentStepNumber` (1-6) para indicar en qué paso está el usuario
- Validar solo los campos del paso actual y pasos anteriores
- Permitir actualizar una solicitud existente agregando información de pasos siguientes
- No requerir completar todos los pasos para crear la solicitud inicial
- Una solicitud puede estar en estado 'pendiente' mientras se completa el formulario

**Ejemplo de Flujo:**
1. Usuario completa Paso 1 → `POST /requests` con `currentStepNumber: 1` → Solicitud creada con status 'pendiente'
2. Usuario completa Paso 2 → `PATCH /requests/:id` con datos del Paso 2 y `currentStepNumber: 2`
3. ... y así sucesivamente hasta completar los 6 pasos
4. Al completar el Paso 6, la solicitud puede cambiar automáticamente a status 'en-proceso' o permanecer en 'pendiente' hasta revisión

---

**Resumen de Campos por Tipo de Solicitud:**

**Campos Comunes Requeridos:**
- `type`: 'apertura-llc'
- `clientId`: ID del cliente
- `llcType`: 'single' | 'multi' (del Paso 5)

**Campos Específicos de Apertura LLC (Paso 1-4, 6):**
- Todos los campos listados en los pasos 1-4 y 6 según corresponda

**Documentación Requerida (por tipo de LLC):**

**Single Member LLC:**
- Identificación oficial del miembro (pasaporte o licencia)
- Comprobante de domicilio
- Formulario SS-4 (EIN) - si aplica
- Operating Agreement (opcional al inicio, requerido después)

**Multi Member LLC:**
- Identificación oficial de todos los miembros
- Comprobante de domicilio de todos los miembros
- Operating Agreement (REQUERIDO desde el inicio)
- Formulario SS-4 (EIN) - si aplica
- Acuerdo de distribución de porcentajes

**Documentos Generados por el Sistema:**
- Articles of Organization
- EIN Confirmation Letter (CP 575)
- Operating Agreement (si no se proporciona)
- Certificate of Formation

---

##### 2. Renovación LLC (`renovacion-llc`)

El formulario de Renovación LLC consta de **6 pasos** que deben completarse secuencialmente:

**PASO 1: DATOS GENERALES DE LA LLC**

**Campos Requeridos:**
- `llcName`: Nombre de la LLC (REQUERIDO)
- `societyType`: Tipo de sociedad (REQUERIDO) - Pre-llenado: "LLC (Limited Liability Company)"
- `registrationNumber`: Número de registro (REQUERIDO)
- `state`: Estado (REQUERIDO) - Dropdown
- `hasDataOrDirectorsChanges`: ¿La LLC ha realizado cambios en sus datos o directivos? (REQUERIDO) - Radio: "Sí" | "No"
- `physicalAddress`: Dirección física de la empresa (REQUERIDO)
- `correspondenceAddress`: Dirección de correspondencia (REQUERIDO)
- `country`: País (REQUERIDO)
- `city`: Ciudad (REQUERIDO)
- `postalCode`: Código Postal (REQUERIDO)
- `mainActivityDescription`: Descripción de la actividad principal de la empresa (REQUERIDO) - Textarea
- `contactPhone`: Teléfono de contacto (REQUERIDO)
- `contactEmail`: Correo electrónico de contacto (REQUERIDO)
- `hasEin`: ¿La LLC cuenta con un EIN? (REQUERIDO) - Radio: "Sí" | "No"
  - Si `hasEin === true`:
    - `einNumber`: EIN de la LLC (REQUERIDO)
    - `mainActivity`: ¿Cuál es la actividad principal de la LLC? (REQUERIDO) - Textarea
  - Si `hasEin === false`:
    - `responsiblePerson`: Persona responsable (REQUERIDO)
      - `name`: Nombre (REQUERIDO)
      - `lastName`: Apellido (REQUERIDO)
      - `country`: País (REQUERIDO)
      - `address`: Dirección (REQUERIDO)
      - `email`: Correo electrónico (REQUERIDO)
      - `phone`: Teléfono (REQUERIDO)
- `wantsRegisteredAgent`: ¿Deseas agregar un Agente Registrado? (REQUERIDO) - Radio: "Sí" | "No"
  - Si `wantsRegisteredAgent === true`:
    - `registeredAgentName`: Nombre del Agente (REQUERIDO)
    - `registeredAgentAddress`: Dirección (REQUERIDO)
    - `registeredAgentCountry`: País (REQUERIDO)
    - `registeredAgentCity`: Ciudad (REQUERIDO)
    - `registeredAgentPostalCode`: Código Postal (REQUERIDO)
    - `registeredAgentPhone`: Teléfono (REQUERIDO)
    - `registeredAgentEmail`: Correo electrónico (REQUERIDO)

**Documentos a Subir (Paso 1):**
- `identityDocument`: Documento de identidad del titular/miembros (REQUERIDO) - Archivo
- `proofOfAddress`: Proof of address (REQUERIDO) - Archivo
- `llcContractOrOperatingAgreement`: Contrato de la LLC o Operating Agreement (REQUERIDO) - Archivo
- `articlesOfIncorporation`: Acta de Constitución (REQUERIDO) - Archivo

---

**PASO 2: INFORMACIÓN DE LOS MIEMBROS**

Este paso permite agregar múltiples miembros. Cada miembro requiere:

**Campos Básicos del Miembro:**
- `firstName`: Nombre (REQUERIDO)
- `lastName`: Apellido (REQUERIDO)
- `country`: País (REQUERIDO) - Dropdown
- `state`: Estado (REQUERIDO) - Dropdown
- `city`: Ciudad (REQUERIDO)
- `address`: Dirección (REQUERIDO)
- `postalCode`: Código Postal (REQUERIDO)
- `email`: Correo electrónico (REQUERIDO)
- `phone`: Teléfono (REQUERIDO)

**Subformulario Detallado de Propietario (Información Completa):**

**Información Personal:**
- `firstName`: Nombre (REQUERIDO)
- `lastName`: Apellido (REQUERIDO)
- `passportNumber`: Número Pasaporte Completo (REQUERIDO) - Ejemplo: "A1234567, AB1234567, 123456789"
- `nationality`: Nacionalidad (REQUERIDO) - Dropdown
- `dateOfBirth`: Fecha de nacimiento (REQUERIDO) - Formato: dd-MMM-yyyy

**Información de Contacto:**
- `email`: Correo electrónico (REQUERIDO)
- `phoneNumber`: Teléfono de contacto (REQUERIDO)
- `fullAddress`: Dirección Completa (REQUERIDO)
  - `street`: Calle y número exterior/altura (REQUERIDO) - Ejemplo: "Av. Libertador 1234"
  - `unit`: Número Interior/departamento (OPCIONAL) - Ejemplo: "Piso 2, Oficina 105"
  - `city`: Ciudad (REQUERIDO) - Ejemplo: "Madrid"
  - `stateRegion`: Estado/Región/Provincia (REQUERIDO) - Ejemplo: "Florida, CDMX, Buenos Aires"
  - `postalCode`: Código postal (REQUERIDO) - Ejemplo: "10001"
  - `country`: País de Residencia (REQUERIDO) - Dropdown

**Información Financiera y Fiscal:**
- `percentageOfParticipation`: Porcentaje de participación (REQUERIDO) - Número, rango 0-100, con símbolo "%"
- `ssnOrItin`: Número de SSN/ITIN (si tiene, de lo contrario, dejar en blanco) (OPCIONAL)
- `nationalTaxId`: ID Fiscal Nacional (CUIT) (OPCIONAL) - Ejemplo: CUIT para Argentina
- `taxFilingCountry`: País bajo cuyas leyes el propietario presenta impuestos (REQUERIDO) - Dropdown
- `ownerContributions2024`: Aportes del Propietario desde Cuentas Personales a la LLC en 2024 (OPCIONAL) - Número con sufijo "USD"
- `ownerLoansToLLC2024`: Préstamos del Propietario a la LLC en 2024 (OPCIONAL) - Número con sufijo "USD"
- `loansReimbursedByLLC2024`: Préstamos Reembolsados por la LLC al Propietario en 2024 (OPCIONAL) - Número con sufijo "USD"
- `profitDistributions2024`: Distribuciones de ganancias atribuidas al propietario en 2024 (OPCIONAL) - Número con sufijo "USD"

**Preguntas de Residencia Fiscal y Activos en EE. UU.:**
- `spentMoreThan31DaysInUS`: ¿Pasó más de 31 días en el territorio de Estados Unidos? (REQUERIDO) - Dropdown
  - Nota: "Esto puede afectar las obligaciones fiscales de los propietarios y de la LLC."
- `hasUSFinancialInvestments`: ¿Posee el propietario inversiones financieras o activos dentro de Estados Unidos? (REQUERIDO) - Dropdown
- `isUSCitizen`: ¿El propietario es ciudadano de Estados Unidos? (REQUERIDO) - Dropdown

**Botón:** "Agregar Miembro" - Permite agregar múltiples miembros

---

**PASO 3: DOMICILIO REGISTRADO**

**Campos Requeridos:**
- `registeredAddress`: Dirección (REQUERIDO)
- `registeredCountry`: País (REQUERIDO) - Dropdown
- `registeredState`: Estado (REQUERIDO) - Dropdown
- `registeredCity`: Ciudad (REQUERIDO)
- `registeredPostalCode`: Código Postal (REQUERIDO)

---

**PASO 4: DOCUMENTACIÓN ANEXA**

**Nota:** "Adjunta en formato PDF"

**Documentos a Subir:**
- `capitalContributions`: Aportaciones de Capital (REQUERIDO) - PDF
- `stateRegistration`: Registro del Estado (REQUERIDO) - PDF
- `certificateOfGoodStanding`: Certificado de Buena Reputación (REQUERIDO) - PDF

---

**PASO 5: CONFIRMACIÓN DE DATOS**

**Campos Requeridos:**
- `dataIsCorrect`: ¿Los datos proporcionados son correctos? (REQUERIDO) - Radio: "Sí" | "No"
- `observations`: Observaciones (OPCIONAL) - Textarea

---

**PASO 6: PAGO Y ENVÍO**

**Campos Requeridos:**
- `paymentMethod`: Método de Pago (REQUERIDO) - Dropdown
- `amountToPay`: Monto a pagar (REQUERIDO) - Pre-llenado: "$ 150.00"
- `wantsInvoice`: ¿Deseas facturar? (REQUERIDO) - Radio: "Sí" | "No"
- `paymentProof`: Adjuntar comprobante de pago (REQUERIDO) - Archivo

**Botón Final:** "Enviar Solicitud"

---

**Resumen de Campos por Tipo de Solicitud:**

**Campos Comunes Requeridos:**
- `type`: 'renovacion-llc'
- `clientId`: ID del cliente
- `llcType`: 'single' | 'multi' (determinado por número de miembros en Paso 2)

**Campos Específicos de Renovación LLC (Paso 1-6):**
- Todos los campos listados en los pasos 1-6 según corresponda

**Validaciones de Negocio:**
- La suma de `percentageOfParticipation` de todos los miembros debe ser igual a 100%
- Si `hasEin === true`, entonces `einNumber` y `mainActivity` son requeridos
- Si `hasEin === false`, entonces `responsiblePerson` con todos sus campos es requerido
- Si `wantsRegisteredAgent === true`, entonces todos los campos del agente registrado son requeridos
- Si `dataIsCorrect === false`, se debe solicitar corrección antes de enviar
- El monto de pago debe ser validado según el servicio

**Documentación Requerida:**
- Documento de identidad del titular/miembros
- Proof of address
- Contrato de la LLC o Operating Agreement
- Acta de Constitución
- Aportaciones de Capital (PDF)
- Registro del Estado (PDF)
- Certificado de Buena Reputación (PDF)
- Comprobante de pago

---

##### 3. Cuenta Bancaria (`cuenta-bancaria`)

El formulario de Apertura de Cuenta Bancaria consta de **7 pasos** que deben completarse secuencialmente:

**PASO 1: Información del Solicitante**

**Campos Requeridos:**
- `applicantEmail`: Email (REQUERIDO)
- `applicantFirstName`: Nombre(s) (REQUERIDO)
- `applicantPaternalLastName`: Apellido Paterno (REQUERIDO)
- `applicantMaternalLastName`: Apellido Materno (REQUERIDO)
- `applicantPhone`: Teléfono (REQUERIDO)
- `accountType`: Tipo de cuenta (REQUERIDO) - Dropdown

**SECCIÓN INFORMACIÓN DE LA LLC:**
- `businessType`: Tipo de negocio (REQUERIDO) - Dropdown
- `legalBusinessIdentifier`: Identificador legal de negocio (REQUERIDO)
- `industry`: Industria / Rubro (REQUERIDO) - Dropdown
- `economicActivity`: Actividad económica (REQUERIDO) - Textarea, máx 200 caracteres
  - Placeholder: "Describe el giro de la empresa, productos o servicios"
- `ein`: Número de identificación fiscal (EIN) (REQUERIDO)
  - Placeholder: "número de EIN"
- `certificateOfConstitutionOrArticles`: Certificado de Constitución o Artículos de Organización (REQUERIDO) - Archivo
- `operatingAgreement`: Operating Agreement (REQUERIDO) - Archivo

**Navigation:** "Siguiente" (Next) button

---

**PASO 2: Dirección del Registro**

**Campos Requeridos:**
- `companyAddress`: Dirección de la empresa (REQUERIDO)
  - `street`: Calle y Número (REQUERIDO)
  - `unit`: Departamento / Oficina / Suite (OPCIONAL)
  - `city`: Ciudad (REQUERIDO)
  - `state`: Estado / Provincia (REQUERIDO) - Dropdown, placeholder: "selecciona un estado"
  - `postalCode`: Código Postal (REQUERIDO)
  - `country`: País (REQUERIDO) - Dropdown, default: "Estados Unidos"

**Información del Registered Agent:**
- `isRegisteredAgentInUSA`: ¿Es el Registered Agent en USA? (REQUERIDO) - Radio: "Sí" | "No"
- `registeredAgentName`: Nombre del Registered Agent (REQUERIDO)
- `registeredAgentAddress`: Dirección del Registered Agent (REQUERIDO) - Textarea

**Navigation:** "Anterior" (Previous) and "Siguiente" (Next) buttons

---

**PASO 3: Información de la cuenta bancaria**

**Campos Requeridos:**
- `bankName`: Banco con el que deseas verificar tu cuenta bancaria (REQUERIDO) - Dropdown
  - Placeholder: "selecciona un banco"
  - Nota: No se especifica el banco, se selecciona de una lista
- `swiftBicAba`: SWIFT / BIC / ABA (REQUERIDO)
- `accountNumber`: Número de Cuenta (REQUERIDO)
- `accountType`: Tipo de Cuenta (REQUERIDO) - Dropdown
  - Placeholder: "tipo de cuenta"
- `firstRegistrationDate`: Fecha de registro por primera vez (REQUERIDO) - Date input
- `hasLitigatedCurrentFiscalYear`: ¿Has litigado en el año fiscal actual? (REQUERIDO) - Radio: "Sí" | "No"
  - Si `hasLitigatedCurrentFiscalYear === true`:
    - `litigationDetails`: Detalles de litigio (REQUERIDO) - Text input, placeholder: "escribe aquí"

**Navigation:** "Anterior" (Previous) and "Siguiente" (Next) buttons

---

**PASO 4: Dirección Personal del Propietario**

**Campos Requeridos:**
- `isSameAddressAsBusiness`: ¿Es la misma dirección que tu negocio? (REQUERIDO) - Radio: "Sí" | "No"
  - Si `isSameAddressAsBusiness === false`:
    - `ownerPersonalAddress`: Dirección Personal del Propietario (REQUERIDO)
      - `street`: Calle y Número (REQUERIDO)
      - `unit`: Departamento / Oficina / Suite (OPCIONAL)
      - `city`: Ciudad (REQUERIDO)
      - `state`: Estado / Provincia (REQUERIDO) - Dropdown
      - `postalCode`: Código Postal (REQUERIDO)
      - `country`: País (REQUERIDO) - Dropdown, default: "Estados Unidos"
- `proofOfAddress`: Comprobante de domicilio (REQUERIDO) - Archivo
  - Nota: No debe tener más de 3 meses de antigüedad

**Navigation:** "Anterior" (Previous) and "Siguiente" (Next) buttons

---

**PASO 5: TIPO DE LLC (SINGLE O MULTI MEMBER)**

**Campos Requeridos:**
- `llcType`: Tipo de LLC (REQUERIDO) - Radio:
  - "LLC de un solo miembro (Single Member LLC)"
  - "LLC de múltiples miembros (Multi-Member LLC)"

**Nota:** Este paso determina si se requiere información de un solo propietario o múltiples propietarios en el siguiente paso.

**Navigation:** "Anterior" (Previous) and "Siguiente" (Next) buttons

---

**PASO 6: Identificación de Propietarios**

Este paso varía según el tipo de LLC seleccionado en el Paso 5. Para cada propietario se requiere:

**Campos Requeridos por Propietario:**
- `firstName`: Nombre (REQUERIDO)
- `paternalLastName`: Apellido Paterno (REQUERIDO)
- `maternalLastName`: Apellido Materno (REQUERIDO)
- `dateOfBirth`: Fecha de nacimiento (REQUERIDO) - Formato: "DD MM AAAA"
- `nationality`: Nacionalidad (REQUERIDO) - Dropdown, placeholder: "selecciona una opción"
- `passportOrNationalId`: Pasaporte o Documento Nacional de Identidad (REQUERIDO)
- `identityDocument`: Documento de identidad (REQUERIDO) - Archivo
  - Tipos aceptados: Pasaporte, ID Oficial, o Licencia de Conducir
- `facialPhotograph`: Fotografía de rostro (REQUERIDO) - Archivo

**Nota:** Si es Multi-Member LLC, este paso debe repetirse para cada miembro.

---

**PASO 7: Confirmación y Firma Electrónica**

**Campos Requeridos:**
- `documentCertification`: Certificación de los documentos enviados (REQUERIDO) - Textarea
  - Placeholder: "escribe aquí"
- `acceptsTermsAndConditions`: Acepto los Términos y Condiciones (REQUERIDO) - Checkbox

**Términos y Condiciones incluyen:**
1. Inclusión de servicios (revisión de documentos, preparación de aplicación, etc.)
2. Descripción de "Start Companies" y su rol
3. Garantía de reembolso del 100% bajo condiciones específicas

**Navigation:** "Anterior" (Previous) and "Enviar" (Submit) buttons

---

**SUBFORMULARIO: Miembro que validará la cuenta bancaria**

Este subformulario se usa para el miembro específico que validará la cuenta bancaria (solo uno por LLC puede validar).

**Campos Requeridos:**
- `firstName`: Nombre(s) (REQUERIDO)
- `lastName`: Apellidos (REQUERIDO)
- `dateOfBirth`: Fecha de Nacimiento (REQUERIDO) - Formato: dd-MMM-yyyy
- `nationality`: Nacionalidad (REQUERIDO) - Dropdown, placeholder: "-Select-"
- `citizenship`: Ciudadanía (REQUERIDO) - Dropdown, placeholder: "-Select-"
- `passportNumber`: Número de pasaporte (REQUERIDO)
  - Placeholder: "Como figura en el pasaporte, incluye letras y números"
- `scannedPassport`: Adjunta una copia escaneada o foto legible del pasaporte (REQUERIDO) - Archivo
  - Nota: Asegurarse de que esté vigente
- `workEmail`: Email laboral (REQUERIDO)
  - Checkbox: "Este correo se usará para ingresar a Relay" (This email will be used to log in to Relay)
- `phone`: Teléfono (REQUERIDO)
  - Checkbox: "Debe tener capacidad para recibir SMS" (Must be able to receive SMS)
- `isUSResident`: ¿Es residente en EE.UU.? (REQUERIDO) - Radio: "Sí" | "No"

**Nota:** Este subformulario es específico para el miembro que validará la cuenta bancaria y puede requerir integración con el sistema "Relay" para autenticación.

---

**Resumen de Campos por Tipo de Solicitud:**

**Campos Comunes Requeridos:**
- `type`: 'cuenta-bancaria'
- `clientId`: ID del cliente
- `llcType`: 'single' | 'multi' (del Paso 5)

**Campos Específicos de Cuenta Bancaria (Paso 1-7):**
- Todos los campos listados en los pasos 1-7 según corresponda
- Información del miembro validador (subformulario)

**Validaciones de Negocio:**
- Si `isSameAddressAsBusiness === false`, entonces `ownerPersonalAddress` completo es requerido
- Si `hasLitigatedCurrentFiscalYear === true`, entonces `litigationDetails` es requerido
- Si `llcType === 'multi'`, entonces debe haber información de múltiples propietarios en el Paso 6
- Si `llcType === 'single'`, entonces debe haber información de un solo propietario en el Paso 6
- Solo un miembro puede ser el validador de la cuenta bancaria (subformulario)
- El `proofOfAddress` no debe tener más de 3 meses de antigüedad
- El pasaporte del miembro validador debe estar vigente
- El teléfono del miembro validador debe tener capacidad para recibir SMS

**Documentación Requerida:**
- Certificado de Constitución o Artículos de Organización
- Operating Agreement
- Comprobante de domicilio (no mayor a 3 meses)
- Documento de identidad de cada propietario (Pasaporte, ID Oficial, o Licencia)
- Fotografía de rostro de cada propietario
- Pasaporte escaneado del miembro validador (vigente)

**Integración con Relay:**
- El email laboral del miembro validador puede usarse para autenticación en Relay
- El sistema debe considerar esta integración al procesar la solicitud

---

#### Estructura de Datos para Documentos Requeridos

Cada tipo de solicitud debe tener una tabla de relación que defina qué documentos son requeridos:

```typescript
// Tabla: request_required_documents
{
  id: number;
  requestType: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  llcType?: 'single' | 'multi'; // null si no aplica
  documentName: string; // Ej: "EIN Confirmation Letter"
  documentType: 'certificate' | 'document' | 'form' | 'other';
  required: boolean; // true = obligatorio, false = opcional
  description: string;
  order: number; // Orden de aparición
}
```

**Ejemplos de Documentos Requeridos por Tipo:**

**Apertura LLC - Single Member:**
1. Identificación oficial (REQUERIDO)
2. Comprobante de domicilio (REQUERIDO)
3. Formulario SS-4 (EIN) (OPCIONAL - se puede obtener después)
4. Operating Agreement (OPCIONAL - se genera si no se proporciona)

**Apertura LLC - Multi Member:**
1. Identificación oficial de todos los miembros (REQUERIDO)
2. Comprobante de domicilio de todos los miembros (REQUERIDO)
3. Operating Agreement (REQUERIDO)
4. Acuerdo de distribución de porcentajes (REQUERIDO)
5. Formulario SS-4 (EIN) (OPCIONAL - se puede obtener después)

**Renovación LLC - Single Member:**
1. Certificado de LLC existente (REQUERIDO)
2. EIN actual (REQUERIDO)
3. Identificación oficial actualizada (REQUERIDO)
4. Comprobante de domicilio actualizado (REQUERIDO)
5. Annual Report (REQUERIDO si aplica)

**Renovación LLC - Multi Member:**
1. Certificado de LLC existente (REQUERIDO)
2. EIN actual (REQUERIDO)
3. Identificación oficial de todos los miembros (REQUERIDO)
4. Comprobante de domicilio actualizado de todos (REQUERIDO)
5. Operating Agreement actualizado (REQUERIDO si hay cambios)
6. Annual Report (REQUERIDO si aplica)

**Cuenta Bancaria:**
1. EIN Confirmation Letter (REQUERIDO)
2. Articles of Organization (REQUERIDO)
3. Operating Agreement (REQUERIDO)
4. Identificación oficial del miembro(s) autorizado(s) (REQUERIDO)
5. Comprobante de domicilio del negocio (REQUERIDO)
6. Comprobante de domicilio personal (REQUERIDO)
7. Formulario W-9 (OPCIONAL)

---

#### Endpoints de Solicitudes
- `GET /requests` - Listar todas las solicitudes (con filtros: status, type, clientId, partnerId)
- `GET /requests/my-requests` - Listar solicitudes del usuario actual (cliente o partner)
- `GET /requests/:id` - Obtener detalle de solicitud (incluye miembros si aplica)
- `POST /requests` - Crear nueva solicitud (multipart/form-data para archivos)
  - Soporta guardado parcial por pasos (usando `currentStepNumber`)
  - Valida campos según el paso actual
- `PATCH /requests/:id` - Actualizar solicitud (cambiar status, asignar responsable, etc.)
  - También permite actualizar campos de pasos específicos
- `DELETE /requests/:id` - Eliminar solicitud (solo admin, o si está pendiente)
- `GET /requests/required-documents` - Obtener lista de documentos requeridos por tipo de solicitud
  - Query params: 
    - `type` (requerido): 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria'
    - `llcType` (opcional): 'single' | 'multi' (solo para apertura-llc y renovacion-llc)

#### Endpoints de Miembros (para Multi-Member LLC)
- `GET /requests/:requestId/members` - Listar todos los miembros de una solicitud
- `POST /requests/:requestId/members` - Agregar un miembro a una solicitud
- `PATCH /requests/:requestId/members/:memberId` - Actualizar información de un miembro
- `DELETE /requests/:requestId/members/:memberId` - Eliminar un miembro
- `POST /requests/:requestId/members/:memberId/validate-percentages` - Validar que la suma de porcentajes sea 100%

#### Endpoints de Propietarios (para Cuenta Bancaria - Paso 6)
- `GET /requests/:requestId/owners` - Listar todos los propietarios de una solicitud de cuenta bancaria
- `POST /requests/:requestId/owners` - Agregar un propietario a una solicitud
- `PATCH /requests/:requestId/owners/:ownerId` - Actualizar información de un propietario
- `DELETE /requests/:requestId/owners/:ownerId` - Eliminar un propietario

#### Endpoints de Miembro Validador (para Cuenta Bancaria)
- `GET /requests/:requestId/bank-account-validator` - Obtener el miembro validador de una solicitud
- `POST /requests/:requestId/bank-account-validator` - Crear/actualizar el miembro validador
- `PATCH /requests/:requestId/bank-account-validator` - Actualizar información del miembro validador
- `DELETE /requests/:requestId/bank-account-validator` - Eliminar el miembro validador

#### DTOs Necesarios

**CreateRequestDto (Apertura LLC):**
```typescript
{
  type: 'apertura-llc';
  clientId: number;
  currentStepNumber: number; // 1-6, indica en qué paso está el formulario
  
  // Paso 1: Información de la LLC
  llcName?: string;
  businessType?: string;
  businessDescription?: string;
  llcPhoneNumber?: string;
  llcWebsite?: string;
  llcEmail?: string;
  incorporationState?: string;
  incorporationDate?: Date;
  hasEin?: boolean;
  einNumber?: string;
  einDocument?: File; // Archivo a subir
  noEinReason?: string;
  certificateOfFormation?: File; // Archivo a subir
  
  // Paso 2: Dirección del Registered Agent
  registeredAgentAddress?: {
    street: string;
    building?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  registeredAgentName?: string;
  registeredAgentEmail?: string;
  registeredAgentPhone?: string;
  registeredAgentType?: 'persona' | 'empresa';
  
  // Paso 3: Información de la cuenta bancaria
  needsBankVerificationHelp?: boolean;
  bankAccountType?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankStatement?: File; // Archivo a subir
  
  // Paso 4: Dirección Personal del Propietario
  ownerNationality?: string;
  ownerCountryOfResidence?: string;
  ownerPersonalAddress?: {
    street: string;
    building?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  ownerPhoneNumber?: string;
  ownerEmail?: string;
  
  // Paso 5: Tipo de LLC
  llcType?: 'single' | 'multi';
  
  // Paso 6: Información de los Miembros
  members?: CreateMemberDto[]; // Array de miembros (requerido si llcType === 'multi')
  
  notes?: string;
}
```

**CreateMemberDto:**
```typescript
{
  firstName: string;
  lastName: string;
  passportNumber: string;
  nationality: string;
  scannedPassport: File; // Archivo a subir
  dateOfBirth: Date;
  email: string;
  phoneNumber: string;
  memberAddress: {
    street: string;
    unit?: string;
    city: string;
    stateRegion: string;
    postalCode: string;
    country: string;
  };
  percentageOfParticipation: number; // 0-100
  validatesBankAccount: boolean;
  additionalBankDocs?: File[]; // Archivos adicionales si validatesBankAccount === true
}
```

**CreateRequestDto (Renovación LLC):**
```typescript
{
  type: 'renovacion-llc';
  clientId: number;
  currentStepNumber: number; // 1-6
  
  // Paso 1: Datos Generales de la LLC
  llcName?: string;
  societyType?: string; // Pre-llenado: "LLC (Limited Liability Company)"
  registrationNumber?: string;
  state?: string;
  hasDataOrDirectorsChanges?: boolean;
  physicalAddress?: string;
  correspondenceAddress?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  mainActivityDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  hasEin?: boolean;
  einNumber?: string; // Si hasEin === true
  mainActivity?: string; // Si hasEin === true
  responsiblePerson?: { // Si hasEin === false
    name: string;
    lastName: string;
    country: string;
    address: string;
    email: string;
    phone: string;
  };
  wantsRegisteredAgent?: boolean;
  registeredAgentInfo?: { // Si wantsRegisteredAgent === true
    name: string;
    address: string;
    country: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  identityDocument?: File; // Archivo a subir
  proofOfAddress?: File; // Archivo a subir
  llcContractOrOperatingAgreement?: File; // Archivo a subir
  articlesOfIncorporation?: File; // Archivo a subir
  
  // Paso 2: Información de los Miembros
  members?: CreateMemberDto[]; // Array de miembros
  
  // Paso 3: Domicilio Registrado
  registeredAddress?: string;
  registeredCountry?: string;
  registeredState?: string;
  registeredCity?: string;
  registeredPostalCode?: string;
  
  // Paso 4: Documentación Anexa
  capitalContributions?: File; // PDF
  stateRegistration?: File; // PDF
  certificateOfGoodStanding?: File; // PDF
  
  // Paso 5: Confirmación de Datos
  dataIsCorrect?: boolean;
  observations?: string;
  
  // Paso 6: Pago y Envío
  paymentMethod?: string;
  amountToPay?: number;
  wantsInvoice?: boolean;
  paymentProof?: File; // Archivo a subir
  
  notes?: string;
}
```

**CreateMemberDto (Renovación - Completo):**
```typescript
{
  firstName: string;
  lastName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: Date;
  email: string;
  phoneNumber: string;
  memberAddress: {
    street: string;
    unit?: string;
    city: string;
    stateRegion: string;
    postalCode: string;
    country: string;
  };
  percentageOfParticipation: number; // 0-100
  
  // Campos adicionales para Renovación
  ssnOrItin?: string;
  nationalTaxId?: string;
  taxFilingCountry?: string;
  ownerContributions2024?: number; // USD
  ownerLoansToLLC2024?: number; // USD
  loansReimbursedByLLC2024?: number; // USD
  profitDistributions2024?: number; // USD
  spentMoreThan31DaysInUS?: string;
  hasUSFinancialInvestments?: string;
  isUSCitizen?: string;
}
```

**CreateRequestDto (Cuenta Bancaria):**
```typescript
{
  type: 'cuenta-bancaria';
  clientId: number;
  currentStepNumber: number; // 1-7
  
  // Paso 1: Información del Solicitante
  applicantEmail?: string;
  applicantFirstName?: string;
  applicantPaternalLastName?: string;
  applicantMaternalLastName?: string;
  applicantPhone?: string;
  accountType?: string;
  businessType?: string;
  legalBusinessIdentifier?: string;
  industry?: string;
  economicActivity?: string; // Máx 200 caracteres
  ein?: string;
  certificateOfConstitutionOrArticles?: File; // Archivo a subir
  operatingAgreement?: File; // Archivo a subir
  
  // Paso 2: Dirección del Registro
  companyAddress?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isRegisteredAgentInUSA?: boolean;
  registeredAgentName?: string;
  registeredAgentAddress?: string;
  
  // Paso 3: Información de la cuenta bancaria
  bankName?: string; // Seleccionado de lista
  swiftBicAba?: string;
  accountNumber?: string;
  bankAccountType?: string;
  firstRegistrationDate?: Date;
  hasLitigatedCurrentFiscalYear?: boolean;
  litigationDetails?: string; // Si hasLitigatedCurrentFiscalYear === true
  
  // Paso 4: Dirección Personal del Propietario
  isSameAddressAsBusiness?: boolean;
  ownerPersonalAddress?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  proofOfAddress?: File; // Archivo a subir (no mayor a 3 meses)
  
  // Paso 5: Tipo de LLC
  llcType?: 'single' | 'multi';
  
  // Paso 6: Identificación de Propietarios
  owners?: CreateOwnerDto[]; // Array de propietarios
  
  // Paso 7: Confirmación y Firma Electrónica
  documentCertification?: string;
  acceptsTermsAndConditions?: boolean;
  
  // Miembro Validador (subformulario)
  bankAccountValidator?: CreateBankAccountValidatorDto;
  
  notes?: string;
}
```

**CreateOwnerDto (Cuenta Bancaria):**
```typescript
{
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  dateOfBirth: Date; // Formato: DD MM AAAA
  nationality: string;
  passportOrNationalId: string;
  identityDocument: File; // Pasaporte, ID Oficial, o Licencia
  facialPhotograph: File; // Fotografía de rostro
}
```

**CreateBankAccountValidatorDto:**
```typescript
{
  firstName: string;
  lastName: string;
  dateOfBirth: Date; // Formato: dd-MMM-yyyy
  nationality: string;
  citizenship: string;
  passportNumber: string; // Como figura en el pasaporte
  scannedPassport: File; // Pasaporte escaneado (vigente)
  workEmail: string;
  useEmailForRelayLogin: boolean; // Este correo se usará para ingresar a Relay
  phone: string;
  canReceiveSMS: boolean; // Debe tener capacidad para recibir SMS
  isUSResident: boolean; // ¿Es residente en EE.UU.?
}
```

**UpdateRequestDto:**
```typescript
{
  status?: 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  notes?: string;
  // Cualquier campo específico que pueda actualizarse
}
```

**FilterRequestsDto:**
```typescript
{
  status?: 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  type?: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  clientId?: number;
  partnerId?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
```

**RequestRequiredDocumentsResponse:**
```typescript
{
  type: string;
  llcType?: 'single' | 'multi';
  documents: Array<{
    name: string;
    type: 'certificate' | 'document' | 'form' | 'other';
    required: boolean;
    description: string;
    order: number;
  }>;
}
```

---

### 4. Procesos/Pasos (`/process-steps`) - ⚠️ NUEVO MÓDULO

Cada solicitud tiene un proceso con pasos definidos.

#### Entidad ProcessStep
```typescript
{
  id: number;
  requestId: number; // FK a Request
  name: string; // Ej: "Solicitud Recibida", "Revisión de Documentos"
  description: string;
  status: 'completed' | 'current' | 'pending';
  order: number; // Orden del paso
  completedAt?: Date;
  completedBy?: string; // Nombre del responsable
  assignedTo?: string; // Usuario asignado
  createdAt: Date;
  updatedAt: Date;
}
```

#### Endpoints de Procesos
- `GET /process-steps/request/:requestId` - Obtener pasos de una solicitud
- `PATCH /process-steps/:id` - Actualizar estado de un paso
- `PATCH /process-steps/:id/assign` - Asignar responsable a un paso
- `POST /process-steps` - Crear nuevo paso (admin, para configuración)

---

### 5. Documentos (`/documents`) - ⚠️ NUEVO MÓDULO

#### Entidad Document
```typescript
{
  id: number;
  requestId: number; // FK a Request
  name: string;
  type: 'certificate' | 'document' | 'form' | 'other';
  url: string; // URL en S3
  key: string; // Key en S3
  size: number; // Tamaño en bytes
  description?: string;
  uploadedBy: number; // FK a User
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Endpoints de Documentos
- `GET /documents/request/:requestId` - Listar documentos de una solicitud
- `GET /documents/request/:requestId/field/:fieldName` - Listar documentos de un campo específico
- `POST /documents` - Subir uno o múltiples documentos (hasta 5 por campo)
  - Body: `multipart/form-data` con `files[]` (array de archivos)
  - Parámetros: `requestId`, `fieldName`, `documentType`, `description`
- `POST /documents/single` - Subir un solo documento (compatibilidad)
- `GET /documents/:id/download` - Descargar documento desde Zoho Workdrive
- `DELETE /documents/:id` - Eliminar documento (también de Zoho Workdrive)

**Nota:** 
- Los archivos se almacenan en **Zoho Workdrive** (no en S3)
- Algunos campos permiten hasta 5 archivos
- Cada archivo se guarda como un registro separado en la tabla `documents`
- El campo `fieldName` identifica a qué campo del formulario pertenece el archivo

---

### 6. Notificaciones (`/notifications`) - ⚠️ NUEVO MÓDULO

#### Entidad Notification
```typescript
{
  id: number;
  userId: number; // FK a User
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link?: string; // URL relativa para navegar
  requestId?: number; // FK a Request (opcional)
  createdAt: Date;
  updatedAt: Date;
}
```

#### Endpoints de Notificaciones
- `GET /notifications` - Listar notificaciones del usuario actual
- `GET /notifications/unread-count` - Obtener contador de no leídas
- `PATCH /notifications/:id/read` - Marcar como leída
- `PATCH /notifications/read-all` - Marcar todas como leídas
- `POST /notifications` - Crear notificación (sistema interno)
- `DELETE /notifications/:id` - Eliminar notificación

---

### 7. Configuración (`/settings`) - ⚠️ NUEVO MÓDULO

#### Entidad UserPreferences
```typescript
{
  id: number;
  userId: number; // FK a User (OneToOne)
  language: 'es' | 'en';
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    requestUpdates: boolean;
    documentUploads: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entidad ProcessConfig (Admin)
```typescript
{
  id: number;
  autoAdvanceSteps: boolean;
  requireApproval: boolean;
  defaultAssignee: string;
  notificationDelay: number; // horas
  createdAt: Date;
  updatedAt: Date;
}
```

#### Endpoints de Configuración
- `GET /settings/preferences` - Obtener preferencias del usuario actual
- `PATCH /settings/preferences` - Actualizar preferencias
- `GET /settings/process-config` - Obtener configuración de procesos (admin)
- `PATCH /settings/process-config` - Actualizar configuración de procesos (admin)

---

### 8. Reportes (`/reports`) - ⚠️ NUEVO MÓDULO

#### Endpoints de Reportes
- `GET /reports/partner-performance` - Reporte de rendimiento de partners (admin)
  - Query params: `startDate`, `endDate`, `partnerId`
  - Retorna: métricas, gráficos de datos, tabla de rendimiento

---

## 🔧 Cambios Necesarios en Módulos Existentes

### Auth Module

#### `auth.controller.ts`
```typescript
// Agregar:
@Post('/forgot-password')
forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) { ... }

@Post('/reset-password')
resetPassword(@Body() resetPasswordDto: ResetPasswordDto) { ... }
```

#### `auth.service.ts`
- Implementar lógica de envío de email para recuperación
- Implementar validación de token de reset

#### `signup.dto.ts`
- Agregar validación para `type: 'client' | 'partner' | 'admin'`
- Solo admin puede crear usuarios con tipo 'admin' o 'partner'

---

### User Module

#### `user.entity.ts`
```typescript
// Agregar campos:
@Column({ nullable: true })
phone: string;

@Column({ nullable: true })
company: string;

// Cambiar:
@Column({ default: 'client' }) // En lugar de 'user'
type: 'client' | 'partner' | 'admin';
```

#### `user.controller.ts`
```typescript
// Agregar:
@Get('/me')
@UseGuards(AuthGuard)
getCurrentUser(@Request() req) { ... }

@Get('/partners')
@UseGuards(AuthGuard, RoleGuard(['admin']))
getPartners() { ... }

@Get('/clients')
@UseGuards(AuthGuard, RoleGuard(['admin']))
getClients() { ... }

@Get('/my-clients')
@UseGuards(AuthGuard, RoleGuard(['partner']))
getMyClients(@Request() req) { ... }

@Patch('/me')
@UseGuards(AuthGuard)
updateCurrentUser(@Request() req, @Body() updateDto: UpdateUserDto) { ... }

@Patch('/:id/status')
@UseGuards(AuthGuard, RoleGuard(['admin']))
toggleUserStatus(@Param('id') id: string) { ... }
```

#### `user.service.ts`
- Agregar métodos para filtrar por tipo
- Agregar método para obtener clientes de un partner
- Agregar método para toggle de status

---

### Upload File Module

**⚠️ IMPORTANTE: Almacenamiento en Zoho Workdrive**

Los archivos se almacenarán en **Zoho Workdrive** (no en S3). Algunos campos permiten subir **hasta 5 archivos**.

#### `upload-file.controller.ts`
```typescript
// Modificar POST /upload-file para aceptar múltiples archivos:
@Post()
@UseInterceptors(FilesInterceptor('files', 5)) // Hasta 5 archivos
async uploadFiles(
  @UploadedFiles() files: Express.Multer.File[],
  @Body() uploadDto: UploadFileDto
) {
  // 1. Subir archivos a Zoho Workdrive (nuevo)
  // 2. Crear registros en tabla documents (uno por archivo)
  // 3. Retornar array de documentos creados
}

// O mantener endpoint simple para un archivo:
@Post('single')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() uploadDto: UploadFileDto
) {
  // Subir a Zoho Workdrive y crear registro en documents
}
```

#### `upload-file.dto.ts`
```typescript
// Extender:
export class UploadFileDto {
  @IsOptional()
  @IsNumber()
  requestId?: number;

  @IsOptional()
  @IsString()
  documentType?: 'certificate' | 'document' | 'form' | 'other';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fieldName?: string; // Nombre del campo del formulario (ej: 'identityDocument', 'proofOfAddress')
  
  @IsOptional()
  @IsNumber()
  maxFiles?: number; // Máximo de archivos permitidos para este campo (default: 1, max: 5)
}
```

#### `upload-file.service.ts`
```typescript
// Necesita integrarse con Zoho Workdrive API
// En lugar de AWS S3, usar:
// - Zoho Workdrive API para subir archivos
// - Obtener URLs de descarga desde Zoho
// - Guardar metadata en tabla documents
```

**Campos que permiten múltiples archivos (hasta 5):**
- `identityDocument` (Documento de identidad) - hasta 5 archivos
- `proofOfAddress` (Comprobante de domicilio) - hasta 5 archivos
- `scannedPassport` (Pasaporte escaneado) - hasta 5 archivos
- `additionalBankDocs` (Documentación adicional bancaria) - hasta 5 archivos
- Otros campos según especificación del formulario

**Nota:** La validación debe verificar que no se excedan 5 archivos por campo.

---

## 🗂️ Estructura de Base de Datos

### ⚠️ Consideración de Diseño: Optimización de Espacio

**Problema Identificado:**
Usar una sola tabla `requests` con todos los campos de los 3 tipos de servicios resultaría en:
- Muchos campos NULL (solo se llenan ~33% de los campos por solicitud)
- Desperdicio de espacio en disco (estimado: ~60-70% de campos NULL por fila)
- Esquema difícil de mantener (más de 80 columnas en una sola tabla)
- Posible impacto en rendimiento de índices (índices más grandes)
- Dificultad para agregar nuevos tipos de servicios

**Ejemplo de Ahorro de Espacio:**
- **Tabla única:** ~80 columnas × 10,000 solicitudes = ~800,000 campos (de los cuales ~500,000 serían NULL)
- **Tablas separadas:** 
  - `requests`: 8 columnas × 10,000 = 80,000 campos (sin NULLs)
  - `apertura_llc_requests`: ~30 columnas × 3,333 solicitudes = ~100,000 campos (sin NULLs)
  - `renovacion_llc_requests`: ~40 columnas × 3,333 solicitudes = ~133,000 campos (sin NULLs)
  - `cuenta_bancaria_requests`: ~25 columnas × 3,334 solicitudes = ~83,000 campos (sin NULLs)
  - **Total:** ~396,000 campos (vs 800,000) = **~50% de ahorro de espacio**

**Solución Propuesta: Tabla Base + Tablas Específicas (Class Table Inheritance)**

Usaremos una estrategia de herencia de tablas:
1. **Tabla base `requests`**: Solo campos comunes a todos los tipos
2. **Tablas específicas**: Una por cada tipo de servicio con sus campos únicos
3. **Relación 1:1**: Cada request tiene exactamente una fila en su tabla específica

**Ventajas:**
- ✅ Sin campos NULL innecesarios (solo se almacenan campos relevantes)
- ✅ Esquema más limpio y mantenible
- ✅ Mejor rendimiento de consultas (menos columnas por tabla)
- ✅ Fácil agregar nuevos tipos de servicios (nueva tabla específica)
- ✅ Validaciones más claras por tipo (constraints específicos)
- ✅ Menor uso de memoria/disco
- ✅ Consultas más rápidas (menos datos a escanear)

**Desventajas:**
- ⚠️ Requiere JOINs para obtener datos completos (pero esto es aceptable y optimizable con índices)
- ⚠️ Lógica de aplicación ligeramente más compleja (pero más organizada)

**Nota sobre JOINs:**
PostgreSQL optimiza muy bien los JOINs con índices, y dado que la relación es 1:1, el rendimiento será excelente. Además, en la mayoría de casos, solo necesitaremos los datos de un tipo específico a la vez.

**Ejemplo de Consulta con JOIN:**
```sql
-- Obtener solicitud de Apertura LLC completa
SELECT 
  r.*,
  alr.*
FROM requests r
INNER JOIN apertura_llc_requests alr ON r.id = alr.request_id
WHERE r.id = :requestId AND r.type = 'apertura-llc';

-- Obtener todas las solicitudes con sus datos específicos (usando UNION o consultas separadas)
-- Para listados, es mejor hacer consultas separadas por tipo o usar vistas materializadas
```

**Implementación en NestJS/TypeORM:**

```typescript
// entities/request.entity.ts
@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';

  @Column({ type: 'varchar', length: 50 })
  status: 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'partner_id' })
  partner?: User;

  @OneToOne(() => AperturaLlcRequest, (alr) => alr.request, { cascade: true })
  aperturaLlcRequest?: AperturaLlcRequest;

  @OneToOne(() => RenovacionLlcRequest, (rlr) => rlr.request, { cascade: true })
  renovacionLlcRequest?: RenovacionLlcRequest;

  @OneToOne(() => CuentaBancariaRequest, (cbr) => cbr.request, { cascade: true })
  cuentaBancariaRequest?: CuentaBancariaRequest;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// entities/apertura-llc-request.entity.ts
@Entity('apertura_llc_requests')
export class AperturaLlcRequest {
  @PrimaryColumn()
  @OneToOne(() => Request, (request) => request.aperturaLlcRequest)
  @JoinColumn({ name: 'request_id' })
  request: Request;

  @Column({ type: 'int', check: 'current_step_number BETWEEN 1 AND 6' })
  currentStepNumber: number;

  // ... todos los campos específicos de apertura LLC
}

// En el servicio (requests.service.ts):
async findById(id: number): Promise<Request> {
  const request = await this.requestRepository.findOne({
    where: { id },
    relations: ['client', 'partner', 'aperturaLlcRequest', 'renovacionLlcRequest', 'cuentaBancariaRequest'],
  });
  
  // TypeORM cargará automáticamente la relación correcta según el tipo
  return request;
}

async createAperturaLlcRequest(createDto: CreateRequestDto): Promise<Request> {
  // 1. Crear request base
  const request = this.requestRepository.create({
    type: 'apertura-llc',
    status: 'pendiente',
    clientId: createDto.clientId,
    partnerId: createDto.partnerId,
    notes: createDto.notes,
  });
  await this.requestRepository.save(request);

  // 2. Crear registro específico
  const aperturaRequest = this.aperturaLlcRequestRepository.create({
    requestId: request.id,
    currentStepNumber: createDto.currentStepNumber,
    // ... mapear todos los campos específicos
  });
  await this.aperturaLlcRequestRepository.save(aperturaRequest);

  // 3. Retornar request completo con relación
  return this.findById(request.id);
}
```

**Ventajas de esta implementación:**
- ✅ TypeORM maneja automáticamente los JOINs
- ✅ Solo se cargan los datos necesarios según el tipo
- ✅ Validaciones específicas por tipo en cada entidad
- ✅ Código más organizado y mantenible

---

### Tablas Nuevas Necesarias

```sql
-- ============================================
-- TABLA BASE: Solicitudes (campos comunes)
-- ============================================
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('apertura-llc', 'renovacion-llc', 'cuenta-bancaria')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pendiente', 'en-proceso', 'completada', 'rechazada')),
  client_id INTEGER NOT NULL REFERENCES users(id),
  partner_id INTEGER REFERENCES users(id),
  current_step_id INTEGER,
  current_step_number INTEGER, -- Validado según tipo en tablas específicas
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA ESPECÍFICA: Apertura LLC
-- ============================================
CREATE TABLE apertura_llc_requests (
  request_id INTEGER PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  current_step_number INTEGER CHECK (current_step_number BETWEEN 1 AND 6),
  
  -- Paso 1: Información de la LLC
  llc_name VARCHAR(255),
  business_type VARCHAR(255),
  business_description TEXT,
  llc_phone_number VARCHAR(50),
  llc_website VARCHAR(500),
  llc_email VARCHAR(255),
  incorporation_state VARCHAR(100),
  incorporation_date DATE,
  has_ein BOOLEAN,
  ein_number VARCHAR(50),
  ein_document_url TEXT,
  no_ein_reason TEXT,
  certificate_of_formation_url TEXT,
  
  -- Paso 2: Dirección del Registered Agent
  registered_agent_address JSONB, -- {street, building?, city, state, postalCode, country}
  registered_agent_name VARCHAR(255),
  registered_agent_email VARCHAR(255),
  registered_agent_phone VARCHAR(50),
  registered_agent_type VARCHAR(20) CHECK (registered_agent_type IN ('persona', 'empresa')),
  
  -- Paso 3: Información de la cuenta bancaria
  needs_bank_verification_help BOOLEAN,
  bank_account_type VARCHAR(50),
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  bank_routing_number VARCHAR(100),
  bank_statement_url TEXT,
  
  -- Paso 4: Dirección Personal del Propietario
  owner_nationality VARCHAR(100),
  owner_country_of_residence VARCHAR(100),
  owner_personal_address JSONB, -- {street, building?, city, state, postalCode, country}
  owner_phone_number VARCHAR(50),
  owner_email VARCHAR(255),
  
  -- Paso 5: Tipo de LLC
  llc_type VARCHAR(20) CHECK (llc_type IN ('single', 'multi')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA ESPECÍFICA: Renovación LLC
-- ============================================
CREATE TABLE renovacion_llc_requests (
  request_id INTEGER PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  current_step_number INTEGER CHECK (current_step_number BETWEEN 1 AND 6),
  
  -- Paso 1: Datos Generales de la LLC
  llc_name VARCHAR(255),
  society_type VARCHAR(255), -- Tipo de sociedad
  registration_number VARCHAR(100), -- Número de registro
  state VARCHAR(100), -- Estado
  has_data_or_directors_changes BOOLEAN, -- ¿La LLC ha realizado cambios?
  physical_address VARCHAR(500), -- Dirección física
  correspondence_address VARCHAR(500), -- Dirección de correspondencia
  country VARCHAR(100), -- País
  city VARCHAR(100), -- Ciudad
  postal_code VARCHAR(20), -- Código Postal
  main_activity_description TEXT, -- Descripción de actividad principal
  contact_phone VARCHAR(50), -- Teléfono de contacto
  contact_email VARCHAR(255), -- Correo electrónico de contacto
  has_ein BOOLEAN, -- ¿La LLC cuenta con un EIN?
  ein_number VARCHAR(50), -- Si has_ein === true
  main_activity TEXT, -- Actividad principal si has_ein === true
  responsible_person JSONB, -- Si has_ein === false {name, lastName, country, address, email, phone}
  wants_registered_agent BOOLEAN, -- ¿Deseas agregar un Agente Registrado?
  registered_agent_info JSONB, -- Si wants_registered_agent === true
  identity_document_url TEXT, -- Documento de identidad
  proof_of_address_url TEXT, -- Proof of address
  llc_contract_or_operating_agreement_url TEXT, -- Contrato o Operating Agreement
  articles_of_incorporation_url TEXT, -- Acta de Constitución
  
  -- Paso 3: Domicilio Registrado
  registered_address VARCHAR(500),
  registered_country VARCHAR(100),
  registered_state VARCHAR(100),
  registered_city VARCHAR(100),
  registered_postal_code VARCHAR(20),
  
  -- Paso 4: Documentación Anexa
  capital_contributions_url TEXT, -- Aportaciones de Capital (PDF)
  state_registration_url TEXT, -- Registro del Estado (PDF)
  certificate_of_good_standing_url TEXT, -- Certificado de Buena Reputación (PDF)
  
  -- Paso 5: Confirmación de Datos
  data_is_correct BOOLEAN, -- ¿Los datos proporcionados son correctos?
  observations TEXT, -- Observaciones
  
  -- Paso 6: Pago y Envío
  payment_method VARCHAR(100), -- Método de pago
  amount_to_pay DECIMAL(10,2), -- Monto a pagar
  wants_invoice BOOLEAN, -- ¿Deseas facturar?
  payment_proof_url TEXT, -- Comprobante de pago
  
  -- Paso 5: Tipo de LLC (determinado por número de miembros)
  llc_type VARCHAR(20) CHECK (llc_type IN ('single', 'multi')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA ESPECÍFICA: Cuenta Bancaria
-- ============================================
CREATE TABLE cuenta_bancaria_requests (
  request_id INTEGER PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  current_step_number INTEGER CHECK (current_step_number BETWEEN 1 AND 7),
  
  -- Paso 1: Información del Solicitante
  applicant_email VARCHAR(255),
  applicant_first_name VARCHAR(255),
  applicant_paternal_last_name VARCHAR(255),
  applicant_maternal_last_name VARCHAR(255),
  applicant_phone VARCHAR(50),
  account_type VARCHAR(50), -- Tipo de cuenta
  business_type VARCHAR(255), -- Tipo de negocio
  legal_business_identifier VARCHAR(255), -- Identificador legal de negocio
  industry VARCHAR(255), -- Industria / Rubro
  economic_activity TEXT, -- Actividad económica (máx 200 caracteres)
  ein VARCHAR(50), -- EIN de la LLC
  certificate_of_constitution_or_articles_url TEXT, -- Certificado de Constitución o Artículos
  operating_agreement_url TEXT, -- Operating Agreement
  
  -- Paso 2: Dirección del Registro
  company_address JSONB, -- {street, unit?, city, state, postalCode, country}
  is_registered_agent_in_usa BOOLEAN, -- ¿Es el Registered Agent en USA?
  registered_agent_name VARCHAR(255),
  registered_agent_address TEXT, -- Textarea
  
  -- Paso 3: Información de la cuenta bancaria
  bank_name VARCHAR(255), -- Banco seleccionado de lista
  swift_bic_aba VARCHAR(50), -- SWIFT / BIC / ABA
  account_number VARCHAR(100), -- Número de Cuenta
  bank_account_type VARCHAR(50), -- Tipo de Cuenta
  first_registration_date DATE, -- Fecha de registro por primera vez
  has_litigated_current_fiscal_year BOOLEAN, -- ¿Has litigado en el año fiscal actual?
  litigation_details TEXT, -- Si has_litigated_current_fiscal_year = true
  
  -- Paso 4: Dirección Personal del Propietario
  is_same_address_as_business BOOLEAN, -- ¿Es la misma dirección que tu negocio?
  owner_personal_address JSONB, -- {street, unit?, city, state, postalCode, country}
  proof_of_address_url TEXT, -- Comprobante de domicilio (no mayor a 3 meses)
  
  -- Paso 5: Tipo de LLC
  llc_type VARCHAR(20) CHECK (llc_type IN ('single', 'multi')),
  
  -- Paso 7: Confirmación y Firma Electrónica
  document_certification TEXT, -- Certificación de los documentos enviados
  accepts_terms_and_conditions BOOLEAN, -- Acepto los Términos y Condiciones
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Miembros (para Apertura y Renovación LLC)
-- ============================================
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  passport_number VARCHAR(100) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  scanned_passport_url TEXT, -- Opcional en renovación
  date_of_birth DATE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  member_address JSONB NOT NULL, -- {street, unit?, city, stateRegion, postalCode, country}
  percentage_of_participation DECIMAL(5,2) NOT NULL CHECK (percentage_of_participation >= 0 AND percentage_of_participation <= 100),
  validates_bank_account BOOLEAN DEFAULT FALSE, -- Solo para apertura LLC
  additional_bank_docs_url TEXT, -- JSON array de URLs si validates_bank_account = true
  
  -- Campos adicionales para Renovación LLC
  ssn_or_itin VARCHAR(50), -- Número de SSN/ITIN
  national_tax_id VARCHAR(100), -- ID Fiscal Nacional (CUIT, etc.)
  tax_filing_country VARCHAR(100), -- País bajo cuyas leyes presenta impuestos
  owner_contributions_2024 DECIMAL(12,2), -- Aportes del Propietario en 2024 (USD)
  owner_loans_to_llc_2024 DECIMAL(12,2), -- Préstamos del Propietario a la LLC en 2024 (USD)
  loans_reimbursed_by_llc_2024 DECIMAL(12,2), -- Préstamos Reembolsados por la LLC en 2024 (USD)
  profit_distributions_2024 DECIMAL(12,2), -- Distribuciones de ganancias en 2024 (USD)
  spent_more_than_31_days_in_us VARCHAR(50), -- ¿Pasó más de 31 días en EE. UU.?
  has_us_financial_investments VARCHAR(50), -- ¿Posee inversiones/activos en EE. UU.?
  is_us_citizen VARCHAR(50), -- ¿Es ciudadano de EE. UU.?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para validar que solo un miembro por request valide cuenta bancaria
CREATE UNIQUE INDEX idx_unique_bank_validator 
ON members(request_id) 
WHERE validates_bank_account = true;

-- Trigger para validar que la suma de porcentajes sea 100% por request
CREATE OR REPLACE FUNCTION validate_member_percentages()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage DECIMAL(5,2);
BEGIN
  SELECT COALESCE(SUM(percentage_of_participation), 0)
  INTO total_percentage
  FROM members
  WHERE request_id = COALESCE(NEW.request_id, OLD.request_id);
  
  IF total_percentage != 100.00 THEN
    RAISE EXCEPTION 'La suma de porcentajes de participación debe ser 100%%. Actual: %%%', total_percentage;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_member_percentages
AFTER INSERT OR UPDATE OR DELETE ON members
FOR EACH ROW
EXECUTE FUNCTION validate_member_percentages();

-- Tabla de Miembro Validador de Cuenta Bancaria (OneToOne con Request)
CREATE TABLE bank_account_validators (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  citizenship VARCHAR(100) NOT NULL,
  passport_number VARCHAR(100) NOT NULL,
  scanned_passport_url TEXT NOT NULL, -- Pasaporte escaneado (debe estar vigente)
  work_email VARCHAR(255) NOT NULL,
  use_email_for_relay_login BOOLEAN DEFAULT FALSE, -- Este correo se usará para ingresar a Relay
  phone VARCHAR(50) NOT NULL,
  can_receive_sms BOOLEAN DEFAULT FALSE, -- Debe tener capacidad para recibir SMS
  is_us_resident BOOLEAN NOT NULL, -- ¿Es residente en EE.UU.?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Propietarios para Cuenta Bancaria (diferente de Members, para Paso 6)
CREATE TABLE bank_account_owners (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  paternal_last_name VARCHAR(255) NOT NULL,
  maternal_last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  passport_or_national_id VARCHAR(100) NOT NULL,
  identity_document_url TEXT NOT NULL, -- Pasaporte, ID Oficial, o Licencia
  facial_photograph_url TEXT NOT NULL, -- Fotografía de rostro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Documentos Requeridos por Tipo de Solicitud
CREATE TABLE request_required_documents (
  id SERIAL PRIMARY KEY,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('apertura-llc', 'renovacion-llc', 'cuenta-bancaria')),
  llc_type VARCHAR(20) CHECK (llc_type IN ('single', 'multi')), -- NULL si no aplica
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('certificate', 'document', 'form', 'other')),
  required BOOLEAN DEFAULT TRUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales de documentos requeridos
INSERT INTO request_required_documents (request_type, llc_type, document_name, document_type, required, description, display_order) VALUES
-- Apertura LLC - Single Member
('apertura-llc', 'single', 'Identificación Oficial', 'document', true, 'Pasaporte o licencia del miembro', 1),
('apertura-llc', 'single', 'Comprobante de Domicilio', 'document', true, 'Comprobante de domicilio del miembro', 2),
('apertura-llc', 'single', 'Formulario SS-4 (EIN)', 'form', false, 'Solicitud de EIN - se puede obtener después', 3),
('apertura-llc', 'single', 'Operating Agreement', 'document', false, 'Acuerdo operativo - se genera si no se proporciona', 4),

-- Apertura LLC - Multi Member
('apertura-llc', 'multi', 'Identificación Oficial de Todos los Miembros', 'document', true, 'Pasaporte o licencia de todos los miembros', 1),
('apertura-llc', 'multi', 'Comprobante de Domicilio de Todos los Miembros', 'document', true, 'Comprobante de domicilio de todos los miembros', 2),
('apertura-llc', 'multi', 'Operating Agreement', 'document', true, 'Acuerdo operativo de la LLC', 3),
('apertura-llc', 'multi', 'Acuerdo de Distribución de Porcentajes', 'document', true, 'Documento que define los porcentajes de cada miembro', 4),
('apertura-llc', 'multi', 'Formulario SS-4 (EIN)', 'form', false, 'Solicitud de EIN - se puede obtener después', 5),

-- Renovación LLC - Single Member
('renovacion-llc', 'single', 'Certificado de LLC Existente', 'certificate', true, 'Certificado oficial de la LLC actual', 1),
('renovacion-llc', 'single', 'EIN Actual', 'document', true, 'EIN Confirmation Letter o documento con EIN', 2),
('renovacion-llc', 'single', 'Identificación Oficial Actualizada', 'document', true, 'Identificación oficial del miembro actualizada', 3),
('renovacion-llc', 'single', 'Comprobante de Domicilio Actualizado', 'document', true, 'Comprobante de domicilio actualizado del miembro', 4),
('renovacion-llc', 'single', 'Annual Report', 'document', true, 'Reporte anual si aplica al estado', 5),

-- Renovación LLC - Multi Member
('renovacion-llc', 'multi', 'Certificado de LLC Existente', 'certificate', true, 'Certificado oficial de la LLC actual', 1),
('renovacion-llc', 'multi', 'EIN Actual', 'document', true, 'EIN Confirmation Letter o documento con EIN', 2),
('renovacion-llc', 'multi', 'Identificación Oficial de Todos los Miembros', 'document', true, 'Identificación oficial actualizada de todos los miembros', 3),
('renovacion-llc', 'multi', 'Comprobante de Domicilio Actualizado de Todos', 'document', true, 'Comprobante de domicilio actualizado de todos los miembros', 4),
('renovacion-llc', 'multi', 'Operating Agreement Actualizado', 'document', true, 'Operating Agreement actualizado si hay cambios', 5),
('renovacion-llc', 'multi', 'Annual Report', 'document', true, 'Reporte anual si aplica al estado', 6),

-- Cuenta Bancaria
('cuenta-bancaria', NULL, 'EIN Confirmation Letter (CP 575)', 'certificate', true, 'Carta de confirmación del EIN emitida por el IRS', 1),
('cuenta-bancaria', NULL, 'Articles of Organization', 'certificate', true, 'Artículos de organización de la LLC', 2),
('cuenta-bancaria', NULL, 'Operating Agreement', 'document', true, 'Acuerdo operativo de la LLC', 3),
('cuenta-bancaria', NULL, 'Identificación Oficial del Miembro(s) Autorizado(s)', 'document', true, 'Identificación oficial de los miembros autorizados para la cuenta', 4),
('cuenta-bancaria', NULL, 'Comprobante de Domicilio del Negocio', 'document', true, 'Comprobante de domicilio comercial', 5),
('cuenta-bancaria', NULL, 'Comprobante de Domicilio Personal', 'document', true, 'Comprobante de domicilio personal del miembro(s)', 6),
('cuenta-bancaria', NULL, 'Formulario W-9', 'form', false, 'Formulario W-9 si aplica', 7);

-- Tabla de Pasos de Proceso
CREATE TABLE process_steps (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'current', 'pending')),
  order_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by VARCHAR(255),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Documentos
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL, -- Nombre del campo del formulario (ej: 'identityDocument', 'proofOfAddress')
  name VARCHAR(255) NOT NULL, -- Nombre original del archivo
  type VARCHAR(50) NOT NULL CHECK (type IN ('certificate', 'document', 'form', 'other')),
  zoho_workdrive_file_id VARCHAR(255) NOT NULL, -- ID del archivo en Zoho Workdrive
  zoho_workdrive_url TEXT NOT NULL, -- URL de descarga desde Zoho Workdrive
  size BIGINT NOT NULL, -- Tamaño en bytes
  mime_type VARCHAR(100), -- Tipo MIME del archivo
  description TEXT,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Índice para buscar documentos por campo
  CONSTRAINT check_max_files_per_field CHECK (
    (SELECT COUNT(*) FROM documents d2 
     WHERE d2.request_id = documents.request_id 
     AND d2.field_name = documents.field_name) <= 5
  )
);

-- Índice para búsqueda eficiente por request y campo
CREATE INDEX idx_documents_request_field ON documents(request_id, field_name);

-- Tabla de Notificaciones
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500),
  request_id INTEGER REFERENCES requests(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Preferencias de Usuario
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'es' CHECK (language IN ('es', 'en')),
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  timezone VARCHAR(100) DEFAULT 'America/Mexico_City',
  notifications JSONB DEFAULT '{"email": true, "push": true, "requestUpdates": true, "documentUploads": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Configuración de Procesos (Admin)
CREATE TABLE process_config (
  id SERIAL PRIMARY KEY,
  auto_advance_steps BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT TRUE,
  default_assignee VARCHAR(255),
  notification_delay INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX idx_requests_client_id ON requests(client_id);
CREATE INDEX idx_requests_partner_id ON requests(partner_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_type ON requests(type);
CREATE INDEX idx_apertura_llc_requests_request_id ON apertura_llc_requests(request_id);
CREATE INDEX idx_renovacion_llc_requests_request_id ON renovacion_llc_requests(request_id);
CREATE INDEX idx_cuenta_bancaria_requests_request_id ON cuenta_bancaria_requests(request_id);
CREATE INDEX idx_process_steps_request_id ON process_steps(request_id);
CREATE INDEX idx_documents_request_id ON documents(request_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_request_required_documents_type ON request_required_documents(request_type, llc_type);
CREATE INDEX idx_bank_account_validators_request_id ON bank_account_validators(request_id);
CREATE INDEX idx_bank_account_owners_request_id ON bank_account_owners(request_id);
```

### Cambios en Tabla Existente

```sql
-- Modificar tabla users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company VARCHAR(255),
  ALTER COLUMN type SET DEFAULT 'client',
  ADD CONSTRAINT check_user_type CHECK (type IN ('client', 'partner', 'admin'));
```

---

## 🔐 Guards y Middleware Necesarios

### Role Guard (Nuevo)
```typescript
// src/auth/role.guard.ts
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return requiredRoles.includes(user.type);
  }
}
```

### Uso en Controllers
```typescript
@UseGuards(AuthGuard, RoleGuard(['admin']))
@SetMetadata('roles', ['admin'])
```

---

## 📦 Módulos NestJS a Crear

1. **RequestsModule** - Gestión completa de solicitudes
2. **ProcessStepsModule** - Gestión de pasos de proceso
3. **DocumentsModule** - Gestión de documentos (puede integrarse con upload-file)
4. **NotificationsModule** - Sistema de notificaciones
5. **SettingsModule** - Configuración y preferencias
6. **ReportsModule** - Reportes y métricas

---

## 🔄 Flujo de Datos Principal

### Crear Solicitud (Partner)
1. Partner crea solicitud → `POST /requests`
2. Sistema crea pasos iniciales del proceso → `POST /process-steps` (automático)
3. Sistema crea notificación para admin → `POST /notifications` (automático)

### Actualizar Paso de Proceso (Admin)
1. Admin actualiza paso → `PATCH /process-steps/:id`
2. Si paso se completa, avanzar al siguiente → Lógica en service
3. Crear notificación para cliente/partner → `POST /notifications` (automático)

### Subir Documento
1. Usuario sube archivo → `POST /upload-file` (con requestId)
2. Sistema guarda en S3 → Servicio existente
3. Sistema crea registro en `documents` → Nuevo
4. Retornar documento completo

---

## ✅ Checklist de Implementación

### Fase 1: Base de Datos y Entidades
- [ ] Crear migraciones para nuevas tablas
- [ ] Actualizar entidad User con nuevos campos
- [ ] Crear entidad Request
- [ ] Crear entidad ProcessStep
- [ ] Crear entidad Document
- [ ] Crear entidad Notification
- [ ] Crear entidad UserPreferences
- [ ] Crear entidad ProcessConfig

### Fase 2: Módulos Core
- [ ] Crear RequestsModule
- [ ] Crear ProcessStepsModule
- [ ] Crear DocumentsModule
- [ ] Crear NotificationsModule
- [ ] Crear SettingsModule
- [ ] Crear ReportsModule

### Fase 3: Endpoints de Solicitudes
- [ ] GET /requests
- [ ] GET /requests/my-requests
- [ ] GET /requests/:id
- [ ] POST /requests
- [ ] PATCH /requests/:id
- [ ] DELETE /requests/:id

### Fase 4: Endpoints de Procesos
- [ ] GET /process-steps/request/:requestId
- [ ] PATCH /process-steps/:id
- [ ] PATCH /process-steps/:id/assign

### Fase 5: Endpoints de Documentos
- [ ] GET /documents/request/:requestId
- [ ] POST /documents (extender upload-file)
- [ ] GET /documents/:id/download
- [ ] DELETE /documents/:id

### Fase 6: Endpoints de Notificaciones
- [ ] GET /notifications
- [ ] GET /notifications/unread-count
- [ ] PATCH /notifications/:id/read
- [ ] PATCH /notifications/read-all
- [ ] POST /notifications
- [ ] DELETE /notifications/:id

### Fase 7: Endpoints de Usuarios Extendidos
- [ ] GET /users/me
- [ ] GET /users/partners
- [ ] GET /users/clients
- [ ] GET /users/my-clients
- [ ] PATCH /users/me
- [ ] PATCH /users/:id/status

### Fase 8: Endpoints de Configuración
- [ ] GET /settings/preferences
- [ ] PATCH /settings/preferences
- [ ] GET /settings/process-config
- [ ] PATCH /settings/process-config

### Fase 9: Endpoints de Reportes
- [ ] GET /reports/partner-performance

### Fase 10: Autenticación Extendida
- [ ] POST /auth/forgot-password
- [ ] POST /auth/reset-password

### Fase 11: Guards y Seguridad
- [ ] Crear RoleGuard
- [ ] Aplicar guards en todos los endpoints
- [ ] Validar permisos por rol

### Fase 12: Integración y Testing
- [ ] Integrar con frontend
- [ ] Testing de endpoints
- [ ] Validar flujos completos

---

## 📝 Notas Importantes

1. **Blog Separado**: Los módulos de blog (`posts`, `categories`, `tags`, `reusable-elements`) NO se modifican. El panel es completamente independiente.

2. **Roles de Usuario**: 
   - `admin`: Acceso completo
   - `partner`: Puede crear solicitudes, ver sus clientes y solicitudes
   - `client`: Solo puede ver sus propias solicitudes

3. **Notificaciones Automáticas**: El sistema debe crear notificaciones automáticamente cuando:
   - Se crea una solicitud
   - Se actualiza un paso de proceso
   - Se sube un documento
   - Se cambia el estado de una solicitud

4. **Upload de Archivos**: Reutilizar el servicio existente de S3, pero extenderlo para guardar metadata en la tabla `documents`.

5. **Paginación**: Todos los endpoints de listado deben soportar paginación usando `PaginationDto` existente.

6. **Filtros**: Los endpoints de listado deben soportar filtros múltiples (status, type, fecha, etc.).

---

## 🚀 Priorización de Implementación

### MVP (Mínimo Viable)
1. RequestsModule básico (CRUD)
2. ProcessStepsModule básico
3. DocumentsModule (extender upload-file)
4. Notificaciones básicas
5. Endpoints de usuarios extendidos

### Fase 2
1. Notificaciones automáticas
2. SettingsModule
3. Reportes básicos

### Fase 3
1. Reportes avanzados
2. Optimizaciones
3. Analytics

---

Este documento debe servir como guía completa para la implementación del backend del panel.

---

## 📊 Tabla de Campos por Tipo de Servicio

Esta sección proporciona una referencia completa de todos los campos de cada tipo de servicio con sus nombres técnicos y en español para facilitar la validación y los mensajes de error.

### 1. Apertura LLC (`apertura-llc`)

| Paso | Nombre Técnico | Nombre en Español | Tipo | Requerido | Validaciones | Máx Archivos |
|------|----------------|-------------------|------|-----------|--------------|--------------|
| **Paso 1: Información de la LLC** |
| 1 | `llcName` | Nombre de la LLC | string | ✅ | Min: 3, Max: 255 | - |
| 1 | `businessType` | Tipo de Negocio | string | ✅ | Max: 255 | - |
| 1 | `businessDescription` | Descripción del Negocio | string | ✅ | Max: 1000 | - |
| 1 | `llcPhoneNumber` | Número de Teléfono de la LLC | string | ✅ | Formato: "+1 (___) ___-____" | - |
| 1 | `llcWebsite` | Sitio Web de la LLC | string | ❌ | URL válida | - |
| 1 | `llcEmail` | Correo Electrónico de la LLC | string | ✅ | Email válido | - |
| 1 | `incorporationState` | Estado de Incorporación | string | ✅ | Dropdown (estados válidos) | - |
| 1 | `incorporationDate` | Fecha de Incorporación | date | ✅ | Formato: MM/DD/YYYY | - |
| 1 | `hasEin` | ¿La LLC ha obtenido un EIN? | boolean | ✅ | true/false | - |
| 1 | `einNumber` | Número de EIN | string | ⚠️ | Si hasEin=true, requerido | - |
| 1 | `einDocument` | Cargar Documento EIN | file | ⚠️ | Si hasEin=true, PDF, máx 5MB | 1 |
| 1 | `noEinReason` | Motivo por el que no tiene EIN | string | ⚠️ | Si hasEin=false, opcional | - |
| 1 | `certificateOfFormation` | Certificado de Formación de la LLC | file | ✅ | PDF, máx 10MB | 1 |
| **Paso 2: Dirección del Registered Agent** |
| 2 | `registeredAgentAddress.street` | Calle y Número | string | ✅ | Max: 255 | - |
| 2 | `registeredAgentAddress.building` | Edificio/Apartamento/Suite | string | ❌ | Max: 255 | - |
| 2 | `registeredAgentAddress.city` | Ciudad | string | ✅ | Max: 100 | - |
| 2 | `registeredAgentAddress.state` | Estado / Provincia | string | ✅ | Dropdown | - |
| 2 | `registeredAgentAddress.postalCode` | Código Postal | string | ✅ | Max: 20 | - |
| 2 | `registeredAgentAddress.country` | País | string | ✅ | Default: "United States" | - |
| 2 | `registeredAgentName` | Nombre del Registered Agent | string | ✅ | Max: 255 | - |
| 2 | `registeredAgentEmail` | Correo Electrónico del Registered Agent | string | ✅ | Email válido | - |
| 2 | `registeredAgentPhone` | Número de Teléfono del Registered Agent | string | ✅ | Formato: "+1 (___) ___-____" | - |
| 2 | `registeredAgentType` | ¿Es el Registered Agent una persona o empresa en EE. UU.? | enum | ✅ | "persona" \| "empresa" | - |
| **Paso 3: Información de la cuenta bancaria** |
| 3 | `needsBankVerificationHelp` | ¿Necesitas ayuda para verificar tu cuenta bancaria? | boolean | ✅ | true/false | - |
| 3 | `bankAccountType` | Tipo de cuenta bancaria | string | ⚠️ | Si needsBankVerificationHelp=true | - |
| 3 | `bankName` | Nombre del banco | string | ⚠️ | Si needsBankVerificationHelp=true | - |
| 3 | `bankAccountNumber` | Número de cuenta bancaria | string | ⚠️ | Si needsBankVerificationHelp=true | - |
| 3 | `bankRoutingNumber` | Número de ruta del banco | string | ⚠️ | Si needsBankVerificationHelp=true | - |
| 3 | `bankStatement` | Extracto bancario más reciente | file | ⚠️ | Si needsBankVerificationHelp=true, PDF, máx 5MB | 1 |
| **Paso 4: Dirección Personal del Propietario** |
| 4 | `ownerNationality` | Nacionalidad del Propietario | string | ✅ | Dropdown | - |
| 4 | `ownerCountryOfResidence` | País de Residencia del Propietario | string | ✅ | Dropdown | - |
| 4 | `ownerPersonalAddress.street` | Calle y Número | string | ✅ | Max: 255 | - |
| 4 | `ownerPersonalAddress.building` | Edificio/Apartamento/Suite | string | ❌ | Max: 255 | - |
| 4 | `ownerPersonalAddress.city` | Ciudad | string | ✅ | Max: 100 | - |
| 4 | `ownerPersonalAddress.state` | Estado / Provincia | string | ✅ | Dropdown | - |
| 4 | `ownerPersonalAddress.postalCode` | Código Postal | string | ✅ | Max: 20 | - |
| 4 | `ownerPersonalAddress.country` | País | string | ✅ | Dropdown | - |
| 4 | `ownerPhoneNumber` | Número de Teléfono Personal | string | ✅ | Formato: "+1 (___) ___-____" | - |
| 4 | `ownerEmail` | Correo Electrónico Personal | string | ✅ | Email válido | - |
| **Paso 5: Tipo de LLC** |
| 5 | `llcType` | Tipo de LLC | enum | ✅ | "single" \| "multi" | - |
| **Paso 6: Información de los Miembros** |
| 6 | `members[].firstName` | Nombres | string | ✅ | Max: 255 | - |
| 6 | `members[].lastName` | Apellidos | string | ✅ | Max: 255 | - |
| 6 | `members[].passportNumber` | Número Pasaporte Completo | string | ✅ | Max: 100 | - |
| 6 | `members[].nationality` | Nacionalidad | string | ✅ | Dropdown | - |
| 6 | `members[].scannedPassport` | Pasaporte escaneado | file | ✅ | JPG, PNG, PDF, máx 5MB | 5 |
| 6 | `members[].dateOfBirth` | Fecha de nacimiento | date | ✅ | Formato: dd-MMM-yyyy | - |
| 6 | `members[].email` | Correo electrónico | string | ✅ | Email válido | - |
| 6 | `members[].phoneNumber` | Teléfono de contacto | string | ✅ | Max: 50 | - |
| 6 | `members[].memberAddress.street` | Calle y número exterior/altura | string | ✅ | Max: 255 | - |
| 6 | `members[].memberAddress.unit` | Número interior/departamento | string | ❌ | Max: 255 | - |
| 6 | `members[].memberAddress.city` | Ciudad | string | ✅ | Max: 100 | - |
| 6 | `members[].memberAddress.stateRegion` | Estado/Región/Provincia | string | ✅ | Max: 100 | - |
| 6 | `members[].memberAddress.postalCode` | Código postal | string | ✅ | Max: 20 | - |
| 6 | `members[].memberAddress.country` | País de Residencia | string | ✅ | Dropdown | - |
| 6 | `members[].percentageOfParticipation` | Porcentaje de participación | number | ✅ | 0-100, suma total = 100% | - |
| 6 | `members[].validatesBankAccount` | ¿Validará este propietario la cuenta bancaria? | boolean | ✅ | Solo uno por LLC = true | - |
| 6 | `members[].additionalBankDocs` | Documentación adicional | file[] | ⚠️ | Si validatesBankAccount=true, máx 5MB c/u | 5 |

---

### 2. Renovación LLC (`renovacion-llc`)

| Paso | Nombre Técnico | Nombre en Español | Tipo | Requerido | Validaciones | Máx Archivos |
|------|----------------|-------------------|------|-----------|--------------|--------------|
| **Paso 1: Datos Generales de la LLC** |
| 1 | `llcName` | Nombre de la LLC | string | ✅ | Max: 255 | - |
| 1 | `societyType` | Tipo de sociedad | string | ✅ | Default: "LLC (Limited Liability Company)" | - |
| 1 | `registrationNumber` | Número de registro | string | ✅ | Max: 100 | - |
| 1 | `state` | Estado | string | ✅ | Dropdown | - |
| 1 | `hasDataOrDirectorsChanges` | ¿La LLC ha realizado cambios en sus datos o directivos? | boolean | ✅ | true/false | - |
| 1 | `physicalAddress` | Dirección física de la empresa | string | ✅ | Max: 500 | - |
| 1 | `correspondenceAddress` | Dirección de correspondencia | string | ✅ | Max: 500 | - |
| 1 | `country` | País | string | ✅ | Max: 100 | - |
| 1 | `city` | Ciudad | string | ✅ | Max: 100 | - |
| 1 | `postalCode` | Código Postal | string | ✅ | Max: 20 | - |
| 1 | `mainActivityDescription` | Descripción de la actividad principal de la empresa | text | ✅ | Max: 2000 | - |
| 1 | `contactPhone` | Teléfono de contacto | string | ✅ | Max: 50 | - |
| 1 | `contactEmail` | Correo electrónico de contacto | string | ✅ | Email válido | - |
| 1 | `hasEin` | ¿La LLC cuenta con un EIN? | boolean | ✅ | true/false | - |
| 1 | `einNumber` | EIN de la LLC | string | ⚠️ | Si hasEin=true, requerido | - |
| 1 | `mainActivity` | ¿Cuál es la actividad principal de la LLC? | text | ⚠️ | Si hasEin=true, requerido | - |
| 1 | `responsiblePerson.name` | Nombre (Persona responsable) | string | ⚠️ | Si hasEin=false, requerido | - |
| 1 | `responsiblePerson.lastName` | Apellido (Persona responsable) | string | ⚠️ | Si hasEin=false, requerido | - |
| 1 | `responsiblePerson.country` | País (Persona responsable) | string | ⚠️ | Si hasEin=false, requerido | - |
| 1 | `responsiblePerson.address` | Dirección (Persona responsable) | string | ⚠️ | Si hasEin=false, requerido | - |
| 1 | `responsiblePerson.email` | Correo electrónico (Persona responsable) | string | ⚠️ | Si hasEin=false, email válido | - |
| 1 | `responsiblePerson.phone` | Teléfono (Persona responsable) | string | ⚠️ | Si hasEin=false, requerido | - |
| 1 | `wantsRegisteredAgent` | ¿Deseas agregar un Agente Registrado? | boolean | ✅ | true/false | - |
| 1 | `registeredAgentInfo.name` | Nombre del Agente | string | ⚠️ | Si wantsRegisteredAgent=true | - |
| 1 | `registeredAgentInfo.address` | Dirección (Agente) | string | ⚠️ | Si wantsRegisteredAgent=true | - |
| 1 | `registeredAgentInfo.country` | País (Agente) | string | ⚠️ | Si wantsRegisteredAgent=true | - |
| 1 | `registeredAgentInfo.city` | Ciudad (Agente) | string | ⚠️ | Si wantsRegisteredAgent=true | - |
| 1 | `registeredAgentInfo.postalCode` | Código Postal (Agente) | string | ⚠️ | Si wantsRegisteredAgent=true | - |
| 1 | `registeredAgentInfo.phone` | Teléfono (Agente) | string | ⚠️ | Si wantsRegisteredAgent=true | - |
| 1 | `registeredAgentInfo.email` | Correo electrónico (Agente) | string | ⚠️ | Si wantsRegisteredAgent=true, email válido | - |
| 1 | `identityDocument` | Documento de identidad del titular/miembros | file | ✅ | PDF, JPG, PNG, máx 10MB | 5 |
| 1 | `proofOfAddress` | Proof of address | file | ✅ | PDF, JPG, PNG, máx 10MB | 5 |
| 1 | `llcContractOrOperatingAgreement` | Contrato de la LLC o Operating Agreement | file | ✅ | PDF, máx 10MB | 1 |
| 1 | `articlesOfIncorporation` | Acta de Constitución | file | ✅ | PDF, máx 10MB | 1 |
| **Paso 2: Información de los Miembros** |
| 2 | `members[].firstName` | Nombre | string | ✅ | Max: 255 | - |
| 2 | `members[].lastName` | Apellido | string | ✅ | Max: 255 | - |
| 2 | `members[].passportNumber` | Número Pasaporte Completo | string | ✅ | Max: 100 | - |
| 2 | `members[].nationality` | Nacionalidad | string | ✅ | Dropdown | - |
| 2 | `members[].dateOfBirth` | Fecha de nacimiento | date | ✅ | Formato: dd-MMM-yyyy | - |
| 2 | `members[].email` | Correo electrónico | string | ✅ | Email válido | - |
| 2 | `members[].phoneNumber` | Teléfono de contacto | string | ✅ | Max: 50 | - |
| 2 | `members[].memberAddress.street` | Calle y número exterior/altura | string | ✅ | Max: 255 | - |
| 2 | `members[].memberAddress.unit` | Número interior/departamento | string | ❌ | Max: 255 | - |
| 2 | `members[].memberAddress.city` | Ciudad | string | ✅ | Max: 100 | - |
| 2 | `members[].memberAddress.stateRegion` | Estado/Región/Provincia | string | ✅ | Max: 100 | - |
| 2 | `members[].memberAddress.postalCode` | Código postal | string | ✅ | Max: 20 | - |
| 2 | `members[].memberAddress.country` | País de Residencia | string | ✅ | Dropdown | - |
| 2 | `members[].percentageOfParticipation` | Porcentaje de participación | number | ✅ | 0-100, suma total = 100% | - |
| 2 | `members[].ssnOrItin` | Número de SSN/ITIN | string | ❌ | Max: 50 | - |
| 2 | `members[].nationalTaxId` | ID Fiscal Nacional (CUIT) | string | ❌ | Max: 100 | - |
| 2 | `members[].taxFilingCountry` | País bajo cuyas leyes el propietario presenta impuestos | string | ✅ | Dropdown | - |
| 2 | `members[].ownerContributions2024` | Aportes del Propietario desde Cuentas Personales a la LLC en 2024 | number | ❌ | USD, >= 0 | - |
| 2 | `members[].ownerLoansToLLC2024` | Préstamos del Propietario a la LLC en 2024 | number | ❌ | USD, >= 0 | - |
| 2 | `members[].loansReimbursedByLLC2024` | Préstamos Reembolsados por la LLC al Propietario en 2024 | number | ❌ | USD, >= 0 | - |
| 2 | `members[].profitDistributions2024` | Distribuciones de ganancias atribuidas al propietario en 2024 | number | ❌ | USD, >= 0 | - |
| 2 | `members[].spentMoreThan31DaysInUS` | ¿Pasó más de 31 días en el territorio de Estados Unidos? | string | ✅ | Dropdown (Sí/No) | - |
| 2 | `members[].hasUSFinancialInvestments` | ¿Posee el propietario inversiones financieras o activos dentro de Estados Unidos? | string | ✅ | Dropdown (Sí/No) | - |
| 2 | `members[].isUSCitizen` | ¿El propietario es ciudadano de Estados Unidos? | string | ✅ | Dropdown (Sí/No) | - |
| **Paso 3: Domicilio Registrado** |
| 3 | `registeredAddress` | Dirección | string | ✅ | Max: 500 | - |
| 3 | `registeredCountry` | País | string | ✅ | Dropdown | - |
| 3 | `registeredState` | Estado | string | ✅ | Dropdown | - |
| 3 | `registeredCity` | Ciudad | string | ✅ | Max: 100 | - |
| 3 | `registeredPostalCode` | Código Postal | string | ✅ | Max: 20 | - |
| **Paso 4: Documentación Anexa** |
| 4 | `capitalContributions` | Aportaciones de Capital | file | ✅ | PDF, máx 10MB | 1 |
| 4 | `stateRegistration` | Registro del Estado | file | ✅ | PDF, máx 10MB | 1 |
| 4 | `certificateOfGoodStanding` | Certificado de Buena Reputación | file | ✅ | PDF, máx 10MB | 1 |
| **Paso 5: Confirmación de Datos** |
| 5 | `dataIsCorrect` | ¿Los datos proporcionados son correctos? | boolean | ✅ | true/false | - |
| 5 | `observations` | Observaciones | text | ❌ | Max: 2000 | - |
| **Paso 6: Pago y Envío** |
| 6 | `paymentMethod` | Método de Pago | string | ✅ | Dropdown | - |
| 6 | `amountToPay` | Monto a pagar | number | ✅ | Default: 150.00, >= 0 | - |
| 6 | `wantsInvoice` | ¿Deseas facturar? | boolean | ✅ | true/false | - |
| 6 | `paymentProof` | Adjuntar comprobante de pago | file | ✅ | PDF, JPG, PNG, máx 10MB | 1 |

---

### 3. Cuenta Bancaria (`cuenta-bancaria`)

| Paso | Nombre Técnico | Nombre en Español | Tipo | Requerido | Validaciones | Máx Archivos |
|------|----------------|-------------------|------|-----------|--------------|--------------|
| **Paso 1: Información del Solicitante** |
| 1 | `applicantEmail` | Email | string | ✅ | Email válido | - |
| 1 | `applicantFirstName` | Nombre(s) | string | ✅ | Max: 255 | - |
| 1 | `applicantPaternalLastName` | Apellido Paterno | string | ✅ | Max: 255 | - |
| 1 | `applicantMaternalLastName` | Apellido Materno | string | ✅ | Max: 255 | - |
| 1 | `applicantPhone` | Teléfono | string | ✅ | Max: 50 | - |
| 1 | `accountType` | Tipo de cuenta | string | ✅ | Dropdown | - |
| 1 | `businessType` | Tipo de negocio | string | ✅ | Dropdown | - |
| 1 | `legalBusinessIdentifier` | Identificador legal de negocio | string | ✅ | Max: 255 | - |
| 1 | `industry` | Industria / Rubro | string | ✅ | Dropdown | - |
| 1 | `economicActivity` | Actividad económica | text | ✅ | Max: 200 caracteres | - |
| 1 | `ein` | Número de identificación fiscal (EIN) | string | ✅ | Formato EIN válido | - |
| 1 | `certificateOfConstitutionOrArticles` | Certificado de Constitución o Artículos de Organización | file | ✅ | PDF, máx 10MB | 1 |
| 1 | `operatingAgreement` | Operating Agreement | file | ✅ | PDF, máx 10MB | 1 |
| **Paso 2: Dirección del Registro** |
| 2 | `companyAddress.street` | Calle y Número | string | ✅ | Max: 255 | - |
| 2 | `companyAddress.unit` | Departamento / Oficina / Suite | string | ❌ | Max: 255 | - |
| 2 | `companyAddress.city` | Ciudad | string | ✅ | Max: 100 | - |
| 2 | `companyAddress.state` | Estado / Provincia | string | ✅ | Dropdown | - |
| 2 | `companyAddress.postalCode` | Código Postal | string | ✅ | Max: 20 | - |
| 2 | `companyAddress.country` | País | string | ✅ | Default: "Estados Unidos" | - |
| 2 | `isRegisteredAgentInUSA` | ¿Es el Registered Agent en USA? | boolean | ✅ | true/false | - |
| 2 | `registeredAgentName` | Nombre del Registered Agent | string | ✅ | Max: 255 | - |
| 2 | `registeredAgentAddress` | Dirección del Registered Agent | text | ✅ | Max: 1000 | - |
| **Paso 3: Información de la cuenta bancaria** |
| 3 | `bankName` | Banco con el que deseas verificar tu cuenta bancaria | string | ✅ | Dropdown (lista de bancos) | - |
| 3 | `swiftBicAba` | SWIFT / BIC / ABA | string | ✅ | Max: 50 | - |
| 3 | `accountNumber` | Número de Cuenta | string | ✅ | Max: 100 | - |
| 3 | `bankAccountType` | Tipo de Cuenta | string | ✅ | Dropdown | - |
| 3 | `firstRegistrationDate` | Fecha de registro por primera vez | date | ✅ | Formato: YYYY-MM-DD | - |
| 3 | `hasLitigatedCurrentFiscalYear` | ¿Has litigado en el año fiscal actual? | boolean | ✅ | true/false | - |
| 3 | `litigationDetails` | Detalles de litigio | string | ⚠️ | Si hasLitigatedCurrentFiscalYear=true, requerido | - |
| **Paso 4: Dirección Personal del Propietario** |
| 4 | `isSameAddressAsBusiness` | ¿Es la misma dirección que tu negocio? | boolean | ✅ | true/false | - |
| 4 | `ownerPersonalAddress.street` | Calle y Número | string | ⚠️ | Si isSameAddressAsBusiness=false, requerido | - |
| 4 | `ownerPersonalAddress.unit` | Departamento / Oficina / Suite | string | ❌ | Max: 255 | - |
| 4 | `ownerPersonalAddress.city` | Ciudad | string | ⚠️ | Si isSameAddressAsBusiness=false, requerido | - |
| 4 | `ownerPersonalAddress.state` | Estado / Provincia | string | ⚠️ | Si isSameAddressAsBusiness=false, requerido | - |
| 4 | `ownerPersonalAddress.postalCode` | Código Postal | string | ⚠️ | Si isSameAddressAsBusiness=false, requerido | - |
| 4 | `ownerPersonalAddress.country` | País | string | ⚠️ | Si isSameAddressAsBusiness=false, requerido | - |
| 4 | `proofOfAddress` | Comprobante de domicilio | file | ✅ | PDF, JPG, PNG, máx 10MB, no mayor a 3 meses | 5 |
| **Paso 5: Tipo de LLC** |
| 5 | `llcType` | Tipo de LLC | enum | ✅ | "single" \| "multi" | - |
| **Paso 6: Identificación de Propietarios** |
| 6 | `owners[].firstName` | Nombre | string | ✅ | Max: 255 | - |
| 6 | `owners[].paternalLastName` | Apellido Paterno | string | ✅ | Max: 255 | - |
| 6 | `owners[].maternalLastName` | Apellido Materno | string | ✅ | Max: 255 | - |
| 6 | `owners[].dateOfBirth` | Fecha de nacimiento | date | ✅ | Formato: DD MM AAAA | - |
| 6 | `owners[].nationality` | Nacionalidad | string | ✅ | Dropdown | - |
| 6 | `owners[].passportOrNationalId` | Pasaporte o Documento Nacional de Identidad | string | ✅ | Max: 100 | - |
| 6 | `owners[].identityDocument` | Documento de identidad | file | ✅ | Pasaporte, ID Oficial, o Licencia, máx 10MB | 5 |
| 6 | `owners[].facialPhotograph` | Fotografía de rostro | file | ✅ | JPG, PNG, máx 5MB | 1 |
| **Paso 7: Confirmación y Firma Electrónica** |
| 7 | `documentCertification` | Certificación de los documentos enviados | text | ✅ | Max: 2000 | - |
| 7 | `acceptsTermsAndConditions` | Acepto los Términos y Condiciones | boolean | ✅ | Debe ser true | - |
| **Subformulario: Miembro Validador** |
| - | `bankAccountValidator.firstName` | Nombre(s) | string | ✅ | Max: 255 | - |
| - | `bankAccountValidator.lastName` | Apellidos | string | ✅ | Max: 255 | - |
| - | `bankAccountValidator.dateOfBirth` | Fecha de Nacimiento | date | ✅ | Formato: dd-MMM-yyyy | - |
| - | `bankAccountValidator.nationality` | Nacionalidad | string | ✅ | Dropdown | - |
| - | `bankAccountValidator.citizenship` | Ciudadanía | string | ✅ | Dropdown | - |
| - | `bankAccountValidator.passportNumber` | Número de pasaporte | string | ✅ | Max: 100 | - |
| - | `bankAccountValidator.scannedPassport` | Adjunta una copia escaneada o foto legible del pasaporte | file | ✅ | Pasaporte vigente, JPG, PNG, PDF, máx 10MB | 1 |
| - | `bankAccountValidator.workEmail` | Email laboral | string | ✅ | Email válido | - |
| - | `bankAccountValidator.useEmailForRelayLogin` | Este correo se usará para ingresar a Relay | boolean | ❌ | Default: false | - |
| - | `bankAccountValidator.phone` | Teléfono | string | ✅ | Max: 50 | - |
| - | `bankAccountValidator.canReceiveSMS` | Debe tener capacidad para recibir SMS | boolean | ❌ | Default: false | - |
| - | `bankAccountValidator.isUSResident` | ¿Es residente en EE.UU.? | boolean | ✅ | true/false | - |

---

### Leyenda de la Tabla

- ✅ **Requerido**: Campo obligatorio
- ⚠️ **Condicional**: Requerido solo si otra condición se cumple
- ❌ **Opcional**: Campo no obligatorio
- **Tipo**: Tipo de dato (string, number, date, boolean, enum, file, text)
- **Máx Archivos**: Número máximo de archivos permitidos para ese campo (1-5)
- **Validaciones**: Reglas específicas de validación

### Notas Importantes

1. **Archivos Múltiples**: Los campos que permiten hasta 5 archivos deben validar:
   - Máximo 5 archivos por campo
   - Tamaño máximo por archivo según especificación
   - Formatos permitidos (PDF, JPG, PNG según el campo)

2. **Almacenamiento**: Todos los archivos se almacenan en **Zoho Workdrive**, no en S3.

3. **Validaciones Condicionales**: Los campos marcados con ⚠️ requieren validación condicional basada en otros campos.

4. **Formatos de Fecha**:
   - `MM/DD/YYYY` para fechas de incorporación
   - `dd-MMM-yyyy` para fechas de nacimiento
   - `DD MM AAAA` para fechas en español
   - `YYYY-MM-DD` para fechas estándar ISO

5. **Porcentajes**: La suma de `percentageOfParticipation` de todos los miembros debe ser exactamente 100%.


