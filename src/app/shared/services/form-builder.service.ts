import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/** Controles monetarios renovación LLC: valor numérico >= 0 (no null ni vacío al persistir). */
export const RENOVACION_LLC_MONEY_FIELD_NAMES = [
  'llcOpeningCost',
  'paidToFamilyMembers',
  'paidToLocalCompanies',
  'paidForLLCFormation',
  'paidForLLCDissolution',
  'bankAccountBalanceEndOfYear',
  'totalRevenue2025',
] as const;
import { optionalPublicWebUrlValidator } from '../validators/web-url.validator';

/**
 * Servicio centralizado para construir los FormGroups de los tres servicios.
 * Evita la duplicación de la estructura del formulario entre los wrappers del wizard y del panel.
 */
@Injectable({ providedIn: 'root' })
export class ServiceFormBuilderService {
  constructor(private fb: FormBuilder) {}

  createAperturaLlcForm(): FormGroup {
    return this.fb.group({
      llcType: ['', Validators.required],
      llcName: ['', Validators.required],
      llcNameOption2: [''],
      llcNameOption3: [''],
      businessDescription: ['', Validators.required],
      llcPhoneNumber: [''],
      website: [''],
      llcEmail: ['', [Validators.email]],
      linkedin: ['', optionalPublicWebUrlValidator()],
      incorporationState: ['', Validators.required],
      incorporationDate: [''],
      hasEin: [false],
      einNumber: [''],
      einDocumentUrl: [''],
      noEinReason: [''],
      certificateOfFormationUrl: [''],
      accountType: [''],
      estadoConstitucion: [''],
      annualRevenue: [null],
      actividadFinancieraEsperada: ['', Validators.required],
      registeredAgentAddress: this.fb.group({
        street: [''],
        building: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      registeredAgentName: [''],
      registeredAgentEmail: [''],
      registeredAgentPhone: [''],
      registeredAgentType: [''],
      needsBankVerificationHelp: [false],
      bankAccountType: [''],
      bankName: [''],
      bankAccountNumber: [''],
      bankRoutingNumber: [''],
      bankStatementUrl: ['', Validators.required],
      serviceBillUrl: ['', Validators.required],
      periodicIncome10k: ['', Validators.required],
      bankAccountLinkedEmail: ['', [Validators.required, Validators.email]],
      bankAccountLinkedPhone: ['', Validators.required],
      projectOrCompanyUrl: ['', optionalPublicWebUrlValidator()],
      veracityConfirmation: [''],
      ownerNationality: [''],
      ownerCountryOfResidence: [''],
      ownerPersonalAddress: this.fb.group({
        street: [''],
        building: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      ownerPhoneNumber: [''],
      ownerEmail: ['', [Validators.email]],
      almacenaProductosDepositoUSA: [false],
      declaroImpuestosAntes: [false],
      llcConStartCompanies: [false],
      ingresosMayor250k: [false],
      activosEnUSA: [false],
      ingresosPeriodicos10k: [false],
      contrataServiciosUSA: [false],
      propiedadEnUSA: [false],
      tieneCuentasBancarias: [false],
      members: this.fb.array([])
    });
  }

  createRenovacionLlcForm(): FormGroup {
    const g = this.fb.group({});
    g.addControl('llcName', this.fb.control('', Validators.required));
    g.addControl('state', this.fb.control('', Validators.required));
    g.addControl('llcType', this.fb.control('', Validators.required));
    g.addControl('mainActivity', this.fb.control(''));
    g.addControl('hasPropertyInUSA', this.fb.control(''));
    g.addControl('almacenaProductosDepositoUSA', this.fb.control(''));
    g.addControl('contrataServiciosUSA', this.fb.control(''));
    g.addControl('tieneCuentasBancarias', this.fb.control(''));
    g.addControl('einNumber', this.fb.control(''));
    g.addControl('countriesWhereLLCDoesBusiness', this.fb.control([]));
    g.addControl('llcCreationDate', this.fb.control(''));
    g.addControl('declaracionInicial', this.fb.control(false));
    g.addControl('declaracionAnoCorriente', this.fb.control(false));
    g.addControl('cambioDireccionRA', this.fb.control(false));
    g.addControl('cambioNombre', this.fb.control(false));
    g.addControl('declaracionAnosAnteriores', this.fb.control(false));
    g.addControl('agregarCambiarSocio', this.fb.control(false));
    g.addControl('declaracionCierre', this.fb.control(false));
    g.addControl('owners', this.fb.array([]));
    const moneyValidators = [Validators.required, Validators.min(0)];
    for (const name of RENOVACION_LLC_MONEY_FIELD_NAMES) {
      g.addControl(name, this.fb.control(0, moneyValidators));
    }
    g.addControl('hasFinancialInvestmentsInUSA', this.fb.control(''));
    g.addControl('hasFiledTaxesBefore', this.fb.control(''));
    g.addControl('wasConstitutedWithStartCompanies', this.fb.control(''));
    g.addControl('partnersPassportsFileUrl', this.fb.control(''));
    g.addControl('operatingAgreementAdditionalFileUrl', this.fb.control(''));
    g.addControl('form147Or575FileUrl', this.fb.control('', Validators.required));
    g.addControl('articlesOfOrganizationAdditionalFileUrl', this.fb.control('', Validators.required));
    g.addControl('boiReportFileUrl', this.fb.control(''));
    g.addControl('bankStatementsFileUrl', this.fb.control(''));
    return g;
  }

  /**
   * Fuerza montos renovación LLC a número >= 0 (evita null/'' tras PATCH o inputs vacíos).
   */
  normalizeRenovacionMoneyFields(group: FormGroup): void {
    for (const name of RENOVACION_LLC_MONEY_FIELD_NAMES) {
      const c = group.get(name);
      if (!c) continue;
      const v = c.value;
      let n = 0;
      if (v !== null && v !== undefined && v !== '') {
        const parsed = Number(String(v).replace(',', '.'));
        n = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      }
      c.setValue(n, { emitEvent: false });
    }
  }

  createCuentaBancariaForm(): FormGroup {
    const g = this.fb.group({});
    g.addControl('businessType', this.fb.control('', Validators.required));
    g.addControl('legalBusinessName', this.fb.control('', Validators.required));
    g.addControl('industry', this.fb.control('', Validators.required));
    g.addControl('numberOfEmployees', this.fb.control('', Validators.required));
    g.addControl('briefDescription', this.fb.control('', Validators.required));
    g.addControl(
      'websiteOrSocialMedia',
      this.fb.control('', optionalPublicWebUrlValidator()),
    );
    g.addControl('einLetterUrl', this.fb.control('', Validators.required));
    g.addControl('einNumber', this.fb.control('', Validators.required));
    g.addControl('articlesOrCertificateUrl', this.fb.control('', Validators.required));
    g.addControl('registeredAgentStreet', this.fb.control('', Validators.required));
    g.addControl('registeredAgentUnit', this.fb.control(''));
    g.addControl('registeredAgentCity', this.fb.control('', Validators.required));
    g.addControl('registeredAgentState', this.fb.control('', Validators.required));
    g.addControl('registeredAgentZipCode', this.fb.control('', Validators.required));
    g.addControl('registeredAgentCountry', this.fb.control('United States'));
    g.addControl('incorporationState', this.fb.control(''));
    g.addControl('incorporationMonthYear', this.fb.control(''));
    g.addControl('countriesWhereBusiness', this.fb.control([]));
    g.addControl('validatorMemberId', this.fb.control(''));
    g.addControl('validatorTitle', this.fb.control('', Validators.required));
    g.addControl('validatorIncomeSource', this.fb.control(''));
    g.addControl('validatorAnnualIncome', this.fb.control(''));
    g.addControl('validatorFirstName', this.fb.control('', Validators.required));
    g.addControl('validatorLastName', this.fb.control('', Validators.required));
    g.addControl('validatorDateOfBirth', this.fb.control('', Validators.required));
    g.addControl('validatorNationality', this.fb.control('', Validators.required));
    g.addControl('validatorCitizenship', this.fb.control('', Validators.required));
    g.addControl('validatorPassportNumber', this.fb.control('', Validators.required));
    g.addControl('validatorPassportUrl', this.fb.control('', Validators.required));
    g.addControl('validatorWorkEmail', this.fb.control('', [Validators.required, Validators.email]));
    g.addControl('validatorPhone', this.fb.control('', Validators.required));
    g.addControl('canReceiveSMS', this.fb.control(false));
    g.addControl('isUSResident', this.fb.control(''));
    g.addControl('ownerPersonalStreet', this.fb.control('', Validators.required));
    g.addControl('ownerPersonalUnit', this.fb.control(''));
    g.addControl('ownerPersonalCity', this.fb.control('', Validators.required));
    g.addControl('ownerPersonalState', this.fb.control('', Validators.required));
    g.addControl('ownerPersonalCountry', this.fb.control('', Validators.required));
    g.addControl('ownerPersonalPostalCode', this.fb.control('', Validators.required));
    g.addControl('serviceBillUrl', this.fb.control('', Validators.required));
    g.addControl('isMultiMember', this.fb.control('', Validators.required));
    g.addControl('llcType', this.fb.control(''));
    g.addControl('owners', this.fb.array([]));
    return g;
  }
}
