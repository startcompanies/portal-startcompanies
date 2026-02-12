# MAPEO DE CAMPOS: ZOHO CRM ↔ BASE DE DATOS

## ÍNDICE
1. [Apertura LLC Request](#1-apertura-llc-request)
2. [Renovación LLC Request](#2-renovación-llc-request)
3. [Cuenta Bancaria Request](#3-cuenta-bancaria-request)
4. [Members (Propietarios/Socios)](#4-members-propietariossocios)
5. [Request Principal](#5-request-principal)
6. [Leyenda de Símbolos](#leyenda-de-símbolos)

---

## LEYENDA DE SÍMBOLOS

- ✅ **MANTENER** - Campo correcto, mantener en el sync
- ❌ **ELIMINAR** - Campo obsoleto, eliminar del sync
- ⚠️ **AGREGAR** - Campo faltante, agregar al sync
- 🔄 **TRANSFORMAR** - Campo requiere transformación
- 📁 **WORKDRIVE** - Campo es archivo en WorkDrive, no se mapea desde Zoho
- 🔀 **SUBFORM** - Campo viene de subformulario (Contacto_Principal_LLC o Socios_LLC)

---

## 1. APERTURA LLC REQUEST

### Campos del Account Principal de Zoho → BD

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| `Account_Name` | `llcName` | string | ✅ MANTENER | Directo |
| `Nombre_de_la_LLC_Opci_n_2` | `llcNameOption2` | string | ✅ MANTENER | Directo |
| `Nombre_de_la_LLC_Opci_n_3` | `llcNameOption3` | string | ✅ MANTENER | Directo |
| `Estado_de_Registro` | `incorporationState` | string | ✅ MANTENER | Directo |
| `Actividad_Principal_de_la_LLC` | `businessDescription` | text | ✅ MANTENER | Directo |
| `Estructura_Societaria` | `llcType` | enum('single'\|'multi') | ✅ MANTENER | 🔄 Mapear a 'single' o 'multi' |
| `LinkedIn` | `linkedin` | string | ✅ MANTENER | Directo |
| `N_mero_de_EIN` | `einNumber` | string | ✅ MANTENER | Directo |
| `Website` o `P_gina_web_de_la_LLC` | `website` | string | ✅ MANTENER | Usar Website si existe, sino P_gina_web_de_la_LLC |
| `Website` o `P_gina_web_de_la_LLC` | `projectOrCompanyUrl` | string | ⚠️ AGREGAR | Mismo que website |
| `Actividad_financiera_esperada` | `actividadFinancieraEsperada` | text | ✅ MANTENER | Directo |
| `Tendr_ingresos_peri_dicos_que_suman_USD_10_000` | `periodicIncome10k` | string('si'\|'no') | ✅ MANTENER | 🔄 Boolean → 'si'/'no' |
| `Annual_Revenue` | `annualRevenue` | decimal | ❌ ELIMINAR | No se usa en formulario |
| `Account_Type` | `accountType` | string | ❌ ELIMINAR | No se usa en formulario |
| `Estado_de_constituci_n` | `estadoConstitucion` | string | ❌ ELIMINAR | No se usa en formulario |
| `Almacena_productos_en_un_dep_sito_en_EE_UU` | `almacenaProductosDepositoUSA` | boolean | ❌ ELIMINAR | No se usa en formulario |
| `La_LLC_declar_impuestos_anteriormente` | `declaroImpuestosAntes` | boolean | ❌ ELIMINAR | No se usa en formulario |
| `La_LLC_se_constituy_con_Start_Companies` | `llcConStartCompanies` | boolean | ❌ ELIMINAR | No se usa en formulario |
| `Los_ingresos_brutos_o_activos_superan_250_000` | `ingresosMayor250k` | boolean | ❌ ELIMINAR | No se usa en formulario |
| `Posee_la_LLC_inversiones_o_activos_en_EE_UU` | `activosEnUSA` | boolean | ❌ ELIMINAR | No se usa en formulario |
| `Tu_empresa_contrata_servicios_en_EE_UU` | `contrataServiciosUSA` | boolean | ❌ ELIMINAR | No se usa en formulario |
| `Tu_empresa_posee_o_renta_una_propiedad_en_EE_UU` | `propiedadEnUSA` | boolean | ❌ ELIMINAR | No se usa en formulario |
| `Tu_LLC_tiene_cuentas_bancarias_a_su_nombre` | `tieneCuentasBancarias` | boolean | ❌ ELIMINAR | No se usa en formulario |

### Campos que NO se mapean desde Zoho (correcto)

| Campo BD | Tipo BD | Estado | Razón |
|----------|---------|--------|-------|
| `serviceBillUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `bankStatementUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `bankAccountLinkedEmail` | string | ⚠️ NO MAPEADO | No existe en Zoho |
| `bankAccountLinkedPhone` | string | ⚠️ NO MAPEADO | No existe en Zoho |

---

## 2. RENOVACIÓN LLC REQUEST

### Campos del Account Principal de Zoho → BD

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| `Account_Name` | `llcName` | string | ✅ MANTENER | Directo |
| `Estado_de_Registro` | `state` | string | ✅ MANTENER | Directo |
| `Actividad_Principal_de_la_LLC` | `mainActivity` | text | ✅ MANTENER | Directo |
| `N_mero_de_EIN` | `einNumber` | string | ✅ MANTENER | Directo |
| `Estructura_Societaria` | `llcType` | enum('single'\|'multi') | ✅ MANTENER | 🔄 Mapear a 'single' o 'multi' |
| `Tu_empresa_posee_o_renta_una_propiedad_en_EE_UU` | `hasPropertyInUSA` | string('si'\|'no') | ⚠️ AGREGAR | 🔄 Boolean → 'si'/'no' |
| `Almacena_productos_en_un_dep_sito_en_EE_UU` | `almacenaProductosDepositoUSA` | string('si'\|'no') | ⚠️ AGREGAR | 🔄 Boolean → 'si'/'no' |
| `Tu_empresa_contrata_servicios_en_EE_UU` | `contrataServiciosUSA` | string('si'\|'no') | ⚠️ AGREGAR | 🔄 Boolean → 'si'/'no' |
| `Tu_LLC_tiene_cuentas_bancarias_a_su_nombre` | `tieneCuentasBancarias` | string('si'\|'no') | ⚠️ AGREGAR | 🔄 Boolean → 'si'/'no' |
| `Fecha_de_Constituci_n` | `llcCreationDate` | date | ⚠️ AGREGAR | 🔄 String → Date |
| `Pa_ses_donde_la_LLC_realiza_negocios` | `countriesWhereLLCDoesBusiness` | jsonb (string[]) | ⚠️ AGREGAR | 🔄 Array/String → Array |
| `Posee_la_LLC_inversiones_o_activos_en_EE_UU` | `hasFinancialInvestmentsInUSA` | string('si'\|'no') | ⚠️ AGREGAR | 🔄 Boolean → 'si'/'no' |
| `La_LLC_declar_impuestos_anteriormente` | `hasFiledTaxesBefore` | string('si'\|'no') | ⚠️ AGREGAR | 🔄 Boolean → 'si'/'no' |
| `La_LLC_se_constituy_con_Start_Companies` | `wasConstitutedWithStartCompanies` | string('si'\|'no') | ⚠️ AGREGAR | 🔄 Boolean → 'si'/'no' |

### Campos que NO se mapean desde Zoho (correcto)

| Campo BD | Tipo BD | Estado | Razón |
|----------|---------|--------|-------|
| `llcOpeningCost` | decimal | ✅ NO MAPEADO | Campo contable, no viene de Zoho |
| `paidToFamilyMembers` | decimal | ✅ NO MAPEADO | Campo contable, no viene de Zoho |
| `paidToLocalCompanies` | decimal | ✅ NO MAPEADO | Campo contable, no viene de Zoho |
| `paidForLLCFormation` | decimal | ✅ NO MAPEADO | Campo contable, no viene de Zoho |
| `paidForLLCDissolution` | decimal | ✅ NO MAPEADO | Campo contable, no viene de Zoho |
| `bankAccountBalanceEndOfYear` | decimal | ✅ NO MAPEADO | Campo contable, no viene de Zoho |
| `totalRevenue` | decimal | ✅ NO MAPEADO | Campo contable, no viene de Zoho |
| `declaracionInicial` | boolean | ✅ NO MAPEADO | Checkbox del formulario |
| `declaracionAnoCorriente` | boolean | ✅ NO MAPEADO | Checkbox del formulario |
| `cambioDireccionRA` | boolean | ✅ NO MAPEADO | Checkbox del formulario |
| `cambioNombre` | boolean | ✅ NO MAPEADO | Checkbox del formulario |
| `declaracionAnosAnteriores` | boolean | ✅ NO MAPEADO | Checkbox del formulario |
| `agregarCambiarSocio` | boolean | ✅ NO MAPEADO | Checkbox del formulario |
| `declaracionCierre` | boolean | ✅ NO MAPEADO | Checkbox del formulario |
| `partnersPassportsFileUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `operatingAgreementAdditionalFileUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `form147Or575FileUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `articlesOfOrganizationAdditionalFileUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `boiReportFileUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `bankStatementsFileUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |

---

## 3. CUENTA BANCARIA REQUEST

### Campos del Account Principal de Zoho → BD

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| `Account_Name` | `legalBusinessIdentifier` | string | ✅ MANTENER | Directo |
| `Tipo_de_negocio` | `businessType` | string | ✅ MANTENER | Directo |
| `Industria_Rubro` | `industry` | string | ✅ MANTENER | Directo |
| `Descripci_n_breve` | `economicActivity` | text | ✅ MANTENER | Directo |
| `Estructura_Societaria` | `llcType` | enum('single'\|'multi') | ✅ MANTENER | 🔄 Mapear a 'single' o 'multi' |
| `N_mero_de_EIN` | `ein` | string | ✅ MANTENER | Directo |
| `Banco` | `bankName` | string | ✅ MANTENER | Directo |
| `Fecha_de_Constituci_n` | `firstRegistrationDate` | date | ✅ MANTENER | 🔄 String → Date |
| `Website` o `P_gina_web_de_la_LLC` | `websiteOrSocialMedia` | string | ⚠️ AGREGAR | Usar Website si existe, sino P_gina_web_de_la_LLC |
| `Tipo` | `accountType` | string | ❌ ELIMINAR | Solo se usa para determinar tipo de request, no para guardar |

### Dirección Comercial (Registered Agent)

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| `Calle_y_n_mero` o `Direcci_n_comercial_Calle_y_numero` | `companyAddress.street` | jsonb | ✅ MANTENER | Priorizar Direcci_n_comercial_* |
| `Suite_Apto` o `Direcci_n_comercial_Suite` | `companyAddress.unit` | jsonb | ✅ MANTENER | Priorizar Direcci_n_comercial_* |
| `Ciudad` o `Direcci_n_comercial_Ciudad` | `companyAddress.city` | jsonb | ✅ MANTENER | Priorizar Direcci_n_comercial_* |
| `Estado_Provincia` o `Direcci_n_comercial_Estado` | `companyAddress.state` | jsonb | ✅ MANTENER | Priorizar Direcci_n_comercial_* |
| `Postal_Zip_Code` o `Direcci_n_comercial_Postal` | `companyAddress.postalCode` | jsonb | ✅ MANTENER | Priorizar Direcci_n_comercial_* |
| `Pais` o `Direcci_n_postal_Pais` | `companyAddress.country` | jsonb | ✅ MANTENER | Priorizar Direcci_n_postal_* |
| `Calle_y_n_mero` o `Direcci_n_comercial_Calle_y_numero` | `registeredAgentStreet` | string | ⚠️ AGREGAR | Mismo que companyAddress.street |
| `Suite_Apto` o `Direcci_n_comercial_Suite` | `registeredAgentUnit` | string | ⚠️ AGREGAR | Mismo que companyAddress.unit |
| `Ciudad` o `Direcci_n_comercial_Ciudad` | `registeredAgentCity` | string | ⚠️ AGREGAR | Mismo que companyAddress.city |
| `Estado_Provincia` o `Direcci_n_comercial_Estado` | `registeredAgentState` | string | ⚠️ AGREGAR | Mismo que companyAddress.state |
| `Postal_Zip_Code` o `Direcci_n_comercial_Postal` | `registeredAgentZipCode` | string | ⚠️ AGREGAR | Mismo que companyAddress.postalCode |
| `Pais` o `Direcci_n_postal_Pais` | `registeredAgentCountry` | string | ⚠️ AGREGAR | Mismo que companyAddress.country |
| `Estado_de_Registro` | `incorporationState` | string | ⚠️ AGREGAR | Directo |
| `Pa_ses_donde_la_LLC_realiza_negocios` | `countriesWhereBusiness` | text | ⚠️ AGREGAR | 🔄 Array/String → String separado por comas |

### Datos del Solicitante (desde Account o Subform)

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| 🔀 `Contacto_Principal_LLC[0].Nombres_del_propietario` o `Nombre_s` | `applicantFirstName` | string | ✅ MANTENER | Priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Apellidos_del_propietario` o `Apellidos` | `applicantPaternalLastName` | string | ✅ MANTENER | Split apellidos, priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Apellidos_del_propietario` o `Apellidos` | `applicantMaternalLastName` | string | ✅ MANTENER | Split apellidos, priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Correo_electr_nico_Propietario` o `Email_Laboral` | `applicantEmail` | string | ✅ MANTENER | Priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Tel_fono_Contacto_Propietario` o `Phone` | `applicantPhone` | string | ✅ MANTENER | 🔄 Normalizar teléfono, priorizar subform |

### Datos del Validador (desde Account o Subform)

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| 🔀 `Contacto_Principal_LLC[0].Nombres_del_propietario` o `Nombre_s` | `validatorFirstName` | string | ⚠️ AGREGAR | Priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Apellidos_del_propietario` o `Apellidos` | `validatorLastName` | string | ⚠️ AGREGAR | Priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Fecha_Nacimiento_Propietario` o `Fecha_de_nacimiento` | `validatorDateOfBirth` | date | ⚠️ AGREGAR | 🔄 String → Date, priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Nacionalidad_Propietario` o `Nacionalidad1` | `validatorNationality` | string | ⚠️ AGREGAR | Priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Nro_de_pasaporte_Propietario` o `N_mero_de_pasaporte` | `validatorPassportNumber` | string | ⚠️ AGREGAR | Priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Correo_electr_nico_Propietario` o `Email_Laboral` | `validatorWorkEmail` | string | ⚠️ AGREGAR | Priorizar subform |
| 🔀 `Contacto_Principal_LLC[0].Tel_fono_Contacto_Propietario` o `Phone` | `validatorPhone` | string | ⚠️ AGREGAR | 🔄 Normalizar teléfono, priorizar subform |

### Campos que NO se mapean desde Zoho (correcto)

| Campo BD | Tipo BD | Estado | Razón |
|----------|---------|--------|-------|
| `numberOfEmployees` | string | ✅ NO MAPEADO | No existe en Zoho |
| `incorporationMonthYear` | string | ✅ NO MAPEADO | No existe en Zoho |
| `validatorCitizenship` | string | ✅ NO MAPEADO | No existe en Zoho |
| `validatorCanReceiveSMS` | boolean | ✅ NO MAPEADO | No existe en Zoho |
| `validatorIsUSResident` | boolean | ✅ NO MAPEADO | No existe en Zoho |
| `validatorTitle` | string | ✅ NO MAPEADO | No existe en Zoho |
| `validatorIncomeSource` | string | ✅ NO MAPEADO | No existe en Zoho |
| `validatorAnnualIncome` | numeric | ✅ NO MAPEADO | No existe en Zoho |
| `ownerPersonalAddress` | jsonb | ✅ NO MAPEADO | Dirección personal, no viene de Zoho |
| `einLetterUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `certificateOfConstitutionOrArticlesUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `validatorScannedPassportUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `proofOfAddressUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |

---

## 4. MEMBERS (PROPIETARIOS/SOCIOS)

### Contacto Principal (Contacto_Principal_LLC[0])

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| 🔀 `Nombres_del_propietario` | `firstName` | string | ✅ MANTENER | Directo |
| 🔀 `Apellidos_del_propietario` | `lastName` | string | ✅ MANTENER | Directo |
| 🔀 `Nro_de_pasaporte_Propietario` o `N_mero_de_pasaporte_Propietario` | `passportNumber` | string | ✅ MANTENER | Priorizar Nro_de_pasaporte_Propietario |
| 🔀 `Nacionalidad_Propietario` | `nationality` | string | ✅ MANTENER | Directo |
| 🔀 `Fecha_Nacimiento_Propietario` | `dateOfBirth` | date | ✅ MANTENER | 🔄 String → Date |
| 🔀 `Correo_electr_nico_Propietario` | `email` | string | ✅ MANTENER | Directo |
| 🔀 `Tel_fono_Contacto_Propietario` | `phoneNumber` | string | ✅ MANTENER | 🔄 Normalizar teléfono |
| 🔀 `Porcentaje_Participaci_n_Princ` | `percentageOfParticipation` | decimal | ✅ MANTENER | 🔄 String → Number |
| 🔀 `Calle_y_n_mero_exterior_altura` | `memberAddress.street` | jsonb | ✅ MANTENER | Directo |
| 🔀 `N_mero_interior_departamento_P` | `memberAddress.unit` | jsonb | ✅ MANTENER | Directo |
| 🔀 `Ciudad_Propietario` | `memberAddress.city` | jsonb | ✅ MANTENER | Directo |
| 🔀 `Estado_Regi_n_Provincia_Prop` | `memberAddress.stateRegion` | jsonb | ✅ MANTENER | Directo |
| 🔀 `C_digo_postal_Propietario` | `memberAddress.postalCode` | jsonb | ✅ MANTENER | Directo |
| 🔀 `Pa_s_de_Residencia_Propietario` | `memberAddress.country` | jsonb | ✅ MANTENER | Directo |
| 🔀 `N_mero_de_SSN_ITIN` | `ssnOrItin` | string | ✅ MANTENER | Directo |
| 🔀 `ID_Fiscal_Nacional_CUIT` | `nationalTaxId` | string | ✅ MANTENER | Directo |
| 🔀 `Pa_s_donde_paga_impuestos` | `taxFilingCountry` | string | ✅ MANTENER | Directo |
| 🔀 `Contribuciones_de_capital_realizadas_en_2024_USD` | `ownerContributions` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Pr_stamos_realizados_a_la_LLC_en_2024` | `ownerLoansToLLC` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Pr_stamos_repagados_por_la_LLC_a_Propietario_2024` | `loansReimbursedByLLC` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Retiros_de_capital_realizados_en_2024_USD` | `profitDistributions` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Estuvo_en_EE_UU_m_s_de_31_d_as_en_2024` | `spentMoreThan31DaysInUS` | string('si'\|'no') | ✅ MANTENER | 🔄 Boolean → 'si'/'no' (solo Renovación) |
| 🔀 `Posee_inversiones_o_activos_en_EE_UU` | `hasUSFinancialInvestments` | string('si'\|'no') | ✅ MANTENER | 🔄 Boolean → 'si'/'no' (solo Renovación) |
| 🔀 `Es_ciudadano_de_EE_UU` | `isUSCitizen` | string('si'\|'no') | ✅ MANTENER | 🔄 Boolean → 'si'/'no' (solo Renovación) |

### Socios Adicionales (Socios_LLC[i])

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| 🔀 `Nombres_del_Socio` | `firstName` | string | ✅ MANTENER | Directo |
| 🔀 `Apellidos_del_Socio` | `lastName` | string | ✅ MANTENER | Directo |
| 🔀 `N_mero_de_pasaporte_Socio` o `Nro_de_pasaporte_Socio` | `passportNumber` | string | ✅ MANTENER | Priorizar N_mero_de_pasaporte_Socio |
| 🔀 `Nacionalidad_Socio` | `nationality` | string | ✅ MANTENER | Directo |
| 🔀 `Fecha_de_Nacimiento_Socio` | `dateOfBirth` | date | ✅ MANTENER | 🔄 String → Date |
| 🔀 `Correo_electr_nico_Socio` | `email` | string | ✅ MANTENER | Directo |
| 🔀 `Tel_fono_Socio` | `phoneNumber` | string | ✅ MANTENER | 🔄 Normalizar teléfono |
| 🔀 `Porcentaje_Participaci_n_Socio` | `percentageOfParticipation` | decimal | ✅ MANTENER | 🔄 String → Number |
| 🔀 `Calle_y_n_mero_exterior_altura` | `memberAddress.street` | jsonb | ✅ MANTENER | Directo |
| 🔀 `N_mero_interior_departamento_S` | `memberAddress.unit` | jsonb | ✅ MANTENER | Directo |
| 🔀 `Ciudad_Propietario` | `memberAddress.city` | jsonb | ✅ MANTENER | Directo (mismo campo que propietario) |
| 🔀 `Estado_Regi_n_Provincia_Socio` | `memberAddress.stateRegion` | jsonb | ✅ MANTENER | Directo |
| 🔀 `C_digo_postal_Socio` | `memberAddress.postalCode` | jsonb | ✅ MANTENER | Directo |
| 🔀 `Pa_s_de_Residencia_Socio` | `memberAddress.country` | jsonb | ✅ MANTENER | Directo |
| 🔀 `N_mero_de_SSN_ITIN` | `ssnOrItin` | string | ✅ MANTENER | Directo |
| 🔀 `ID_Fiscal_Nacional_CUIT` | `nationalTaxId` | string | ✅ MANTENER | Directo |
| 🔀 `Pa_s_donde_paga_impuestos` | `taxFilingCountry` | string | ✅ MANTENER | Directo |
| 🔀 `Contribuciones_de_capital_realizadas_en_2024` | `ownerContributions` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Pr_stamos_realizados_a_la_LLC_en_2024` | `ownerLoansToLLC` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Pr_stamos_repagados_por_la_LLC_a_Propietario_2024` | `loansReimbursedByLLC` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Retiros_de_Capital_2024` | `profitDistributions` | decimal | ✅ MANTENER | 🔄 String → Number (solo Renovación) |
| 🔀 `Estuvo_en_EE_UU_m_s_de_31_d_as_en_2024` | `spentMoreThan31DaysInUS` | string('si'\|'no') | ✅ MANTENER | 🔄 Boolean → 'si'/'no' (solo Renovación) |
| 🔀 `Posee_inversiones_o_activos_en_EE_UU` | `hasUSFinancialInvestments` | string('si'\|'no') | ✅ MANTENER | 🔄 Boolean → 'si'/'no' (solo Renovación) |
| 🔀 `Es_ciudadano_de_EE_UU` | `isUSCitizen` | string('si'\|'no') | ✅ MANTENER | 🔄 Boolean → 'si'/'no' (solo Renovación) |

### Campos que NO se mapean desde Zoho (correcto)

| Campo BD | Tipo BD | Estado | Razón |
|----------|---------|--------|-------|
| `scannedPassportUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |
| `validatesBankAccount` | boolean | ✅ NO MAPEADO | Flag interno del sistema |
| `additionalBankDocsUrl` | text | 📁 WORKDRIVE | Archivo en WorkDrive |

---

## 5. REQUEST PRINCIPAL

### Campos del Account Principal de Zoho → BD

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| `id` | `zohoAccountId` | string | ✅ MANTENER | Directo |
| `Tipo` | `type` | enum | ✅ MANTENER | 🔄 'Apertura' → 'apertura-llc', 'Renovación' → 'renovacion-llc', 'Cuenta Bancaria' → 'cuenta-bancaria' |
| `workDriveId` | `workDriveUrlExternal` | string | ✅ MANTENER | 🔄 Generar permalink con zohoWorkDriveService |
| `workDriveUrlExternal` | `workDriveUrlExternal` | string | ✅ MANTENER | Directo (si no hay workDriveId) |
| `Empresa` | `partnerId` | number | ✅ MANTENER | 🔄 Si 'Partner', crear/buscar usuario partner |
| `Partner_Email` | `partnerId` | number | ✅ MANTENER | 🔄 Crear/buscar usuario partner por email |
| `Partner_Phone` | (usuario partner) | string | ✅ MANTENER | 🔄 Guardar en usuario partner |

### Campos desde Deal relacionado

| Campo Zoho | Campo BD | Tipo BD | Estado | Transformación |
|------------|----------|---------|--------|----------------|
| `Deal.Stage` | `stage` | string | ✅ MANTENER | Directo (solo Apertura y Cuenta Bancaria) |
| `Deal.Contact_Name.Email` | `clientId` | number | ✅ MANTENER | 🔄 Crear/buscar usuario cliente por email |
| `Deal.Contact_Name.Phone` | (usuario cliente) | string | ✅ MANTENER | 🔄 Guardar en usuario cliente |
| `Deal.Contact_Name.First_Name` | (usuario cliente) | string | ✅ MANTENER | 🔄 Guardar en usuario cliente |
| `Deal.Contact_Name.Last_Name` | (usuario cliente) | string | ✅ MANTENER | 🔄 Guardar en usuario cliente |

---

## TRANSFORMACIONES NECESARIAS

### 1. Estructura_Societaria → llcTypeescript
// Si contiene 'single' o 'solo miembro' → 'single'
// Si contiene 'multi' o 'multi-miembro' → 'multi'
// Default → 'single'
