import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const CAMPAIGN_REDIRECTS: Record<string, string> = {
  'apertura-llc': '/apertura-llc',
  'renovar-llc': '/renovar-llc',
};

export const campaignRedirectGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);

  const url = state.url;
  const urlParts = url.split('?');
  const path = urlParts[0].replace(/^\//, '');
  const queryString = urlParts[1] || '';

  if (CAMPAIGN_REDIRECTS[path]) {
    const targetPath = CAMPAIGN_REDIRECTS[path];
    const finalUrl = queryString ? `${targetPath}?${queryString}` : targetPath;
    router.navigateByUrl(finalUrl);
    return false;
  }

  return true;
};
