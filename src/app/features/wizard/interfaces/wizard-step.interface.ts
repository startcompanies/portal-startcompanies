export interface WizardStep {
    isValid(): boolean;
    markAsTouched(): void;
}