import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  updateTitle(title: string) {
    this.titleService.setTitle(`${title} | Mulkchi - Ko'chmas Mulk`);
  }

  updateMetaTags(config: { title?: string, description?: string, image?: string, keywords?: string }) {
    if (config.title) {
      this.updateTitle(config.title);
      this.metaService.updateTag({ property: 'og:title', content: config.title });
      this.metaService.updateTag({ name: 'twitter:title', content: config.title });
    }

    if (config.description) {
      this.metaService.updateTag({ name: 'description', content: config.description });
      this.metaService.updateTag({ property: 'og:description', content: config.description });
      this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    }

    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }

    if (config.image) {
      this.metaService.updateTag({ property: 'og:image', content: config.image });
      this.metaService.updateTag({ name: 'twitter:image', content: config.image });
    }

    // Fixed OpenGraph tags
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:url', content: `https://mulkchi.uz${this.router.url}` });
  }

  setIndexable(indexable: boolean = true) {
    if (indexable) {
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    } else {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    }
  }

  setJsonLd(schema: any) {
    // Remove existing JSON-LD if any
    const existingScript = this.document.head.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      this.document.head.removeChild(existingScript);
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }
}
