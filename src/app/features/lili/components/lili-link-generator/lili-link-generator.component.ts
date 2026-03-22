import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { encodeLiliLinkToken } from '../../utils/lili-link-token.util';

@Component({
  selector: 'app-lili-link-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lili-link-generator.component.html',
  styleUrl: './lili-link-generator.component.css',
})
export class LiliLinkGeneratorComponent implements OnInit {
  readonly startCompaniesLogo = 'assets/logos/startcompanieswhite.png';

  form = {
    email: '',
    firstName: '',
    lastName: '',
    businessName: '',
  };

  generatedLink = '';
  loading = false;
  error = '';
  copied = false;

  constructor(
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.meta.addTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  submit(): void {
    if (!this.form.email) return;

    this.loading = true;
    this.error = '';
    this.generatedLink = '';

    const origin = this.document.location?.origin;
    if (!origin) {
      this.error = 'No se pudo determinar la URL base para generar el link.';
      this.loading = false;
      return;
    }

    const token = encodeLiliLinkToken({
      email: this.form.email.trim(),
      firstName: this.form.firstName.trim() || undefined,
      lastName: this.form.lastName.trim() || undefined,
      businessName: this.form.businessName.trim() || undefined,
      exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60,
    });

    this.generatedLink = `${origin}/banking?t=${token}`;
    this.loading = false;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.generatedLink).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }
}
