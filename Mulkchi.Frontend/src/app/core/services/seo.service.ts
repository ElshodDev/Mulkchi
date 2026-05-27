import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UIStore } from '../stores/ui.store';

export interface SeoMetaData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  locale?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);
  private uiStore = inject(UIStore);

  private readonly defaultTitle = "Mulkchi - O'zbekistondagi eng yaxshi mulk platformasi";
  private readonly defaultDescription =
    "Mulkchi - Toshkent va butun O'zbekiston bo'ylab uy-joy, kvartira, ofis va boshqa ko'chmas mulklarni sotish va ijaraga olish platformasi.";
  private readonly defaultKeywords = [
    'mulk',
    'uy-joy',
    'kvartira',
    'sotish',
    'ijara',
    'Toshkent',
    "O'zbekiston",
  ];
  private readonly defaultImage = 'https://mulkchi.uz/assets/images/og-default.jpg';
  private readonly siteUrl = 'https://mulkchi.uz';
  private readonly siteName = 'Mulkchi';
  private readonly twitterHandle = '@mulkchi';


  updateMetaTags(data: Partial<SeoMetaData>): void {
    const metaData: SeoMetaData = {
      title: data.title || this.defaultTitle,
      description: data.description || this.defaultDescription,
      keywords: data.keywords || this.defaultKeywords,
      image: data.image || this.defaultImage,
      url: data.url || this.getCurrentUrl(),
      type: data.type || 'website',
      author: data.author,
      publishedAt: data.publishedAt,
      modifiedAt: data.modifiedAt,
      canonicalUrl: data.canonicalUrl,
      noIndex: data.noIndex || false,
      noFollow: data.noFollow || false,
      locale: data.locale || this.getLocaleFromLanguage(this.uiStore.language()),
    };

    this.setTitle(metaData.title);

    this.setBasicMeta(metaData);

    this.setOpenGraphMeta(metaData);

    this.setTwitterCardMeta(metaData);

    this.setRobotsMeta(metaData.noIndex, metaData.noFollow);

    if (metaData.canonicalUrl) {
      this.setCanonicalUrl(metaData.canonicalUrl);
    }

    this.setLanguage(metaData.locale);
  }

  setTitle(title: string): void {
    const fullTitle = title === this.defaultTitle ? title : `${title} | ${this.siteName}`;
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'title', content: title });
  }

  private setBasicMeta(data: SeoMetaData): void {
    this.meta.updateTag({ name: 'description', content: data.description });

    if (data.keywords && data.keywords.length > 0) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords.join(', ') });
    }

    if (data.author) {
      this.meta.updateTag({ name: 'author', content: data.author });
    }

    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' });

    this.meta.updateTag({ name: 'theme-color', content: '#667eea' });
  }

  private setOpenGraphMeta(data: SeoMetaData): void {
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.meta.updateTag({ property: 'og:url', content: data.url || this.getCurrentUrl() });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({
      property: 'og:locale',
      content: data.locale?.replace('_', '-') || 'uz_UZ',
    });

    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
      this.meta.updateTag({ property: 'og:image:width', content: '1200' });
      this.meta.updateTag({ property: 'og:image:height', content: '630' });
    }

    if (data.type === 'article') {
      if (data.publishedAt) {
        this.meta.updateTag({ property: 'article:published_time', content: data.publishedAt });
      }
      if (data.modifiedAt) {
        this.meta.updateTag({ property: 'article:modified_time', content: data.modifiedAt });
      }
      if (data.author) {
        this.meta.updateTag({ property: 'article:author', content: data.author });
      }
    }
  }

  private setTwitterCardMeta(data: SeoMetaData): void {
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.meta.updateTag({ name: 'twitter:site', content: this.twitterHandle });
    this.meta.updateTag({ name: 'twitter:creator', content: data.author || this.twitterHandle });

    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });

    if (data.image) {
      this.meta.updateTag({ name: 'twitter:image', content: data.image });
      this.meta.updateTag({ name: 'twitter:image:alt', content: data.title });
    }
  }

  setRobotsMeta(noIndex = false, noFollow = false): void {
    let content = 'index, follow';

    if (noIndex && noFollow) {
      content = 'noindex, nofollow';
    } else if (noIndex) {
      content = 'noindex, follow';
    } else if (noFollow) {
      content = 'index, nofollow';
    }

    this.meta.updateTag({ name: 'robots', content });
  }

  setCanonicalUrl(url: string): void {
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing) {
      existing.remove();
    }

    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  setLanguage(locale = 'uz_UZ'): void {
    const lang = locale.split('_')[0] || 'uz';
    document.documentElement.lang = lang;
    if (lang === 'ru' || lang === 'en' || lang === 'uz') {
      this.uiStore.setLanguage(lang);
    }
  }


  private getCurrentUrl(): string {
    return `${this.siteUrl}${this.router.url}`;
  }

  private getLocaleFromLanguage(language: 'uz' | 'ru' | 'en'): string {
    return `${language}_${language === 'uz' ? 'UZ' : language.toUpperCase()}`;
  }

  resetMetaTags(): void {
    this.updateMetaTags({
      title: this.defaultTitle,
      description: this.defaultDescription,
      keywords: this.defaultKeywords,
      image: this.defaultImage,
      type: 'website',
    });
  }


  setPropertyMeta(property: {
    title: string;
    description?: string;
    type: string;
    city: string;
    district: string;
    price: number;
    currency: string;
    images?: string[];
    id: string;
  }): void {
    const title = `${property.title} - ${property.type} ${property.city}da`;
    const description =
      property.description ||
      `${property.title} ${property.district} tumanida ${property.price.toLocaleString()} ${property.currency} ga ${property.type.toLowerCase()}. Mulkchi orqali toping!`;
    const image = property.images?.[0] || this.defaultImage;

    this.updateMetaTags({
      title,
      description,
      keywords: [property.type, property.city, 'sotish', 'ijara', 'uy-joy', 'mulk'],
      image,
      type: 'product',
      url: `${this.siteUrl}/properties/${property.id}`,
      canonicalUrl: `${this.siteUrl}/properties/${property.id}`,
    });
  }

  setSearchMeta(query: string, location?: string): void {
    const locationText = location ? `${location}da` : '';
    const title = `"${query}" ${locationText} qidiruv natijalari`;
    const description = `Mulkchi platformasida "${query}" ${locationText} bo'yicha qidiruv natijalari. Eng yaxshi uy-joy takliflari!`;

    this.updateMetaTags({
      title,
      description,
      keywords: [query, location || '', 'qidiruv', 'mulk', 'uy-joy'],
      noIndex: true,
    });
  }

  setProfileMeta(user: { firstName: string; lastName: string; role: string }): void {
    const roleText = user.role === 'Host' ? 'Host' : 'Foydalanuvchi';
    const title = `${user.firstName} ${user.lastName} - ${roleText} profili`;
    const description = `${user.firstName} ${user.lastName} ${roleText.toLowerCase()} profili va mulk e'lonlari. Mulkchi platformasida!`;

    this.updateMetaTags({
      title,
      description,
      type: 'profile',
      noIndex: true,
    });
  }

  setStaticPageMeta(page: 'home' | 'about' | 'contact' | 'privacy' | 'terms' | 'help'): void {
    const pages: Record<string, SeoMetaData> = {
      home: {
        title: this.defaultTitle,
        description: this.defaultDescription,
        keywords: this.defaultKeywords,
        type: 'website',
      },
      about: {
        title: 'Biz haqimizda - Mulkchi',
        description:
          "Mulkchi - O'zbekistondagi eng yirik ko'chmas mulk platformasi. Bizning maqsad va vazifalarimiz.",
        keywords: ['biz haqimizda', 'mulkchi', 'kompaniya', 'maqsad'],
        type: 'website',
      },
      contact: {
        title: "Bog'lanish - Mulkchi",
        description:
          "Mulkchi jamoasi bilan bog'laning. Savollaringizga javob oling va yordam oling.",
        keywords: ['aloqa', "bog'lanish", 'yordam', "qo'llab-quvvatlash"],
        type: 'website',
      },
      privacy: {
        title: 'Maxfiylik siyosati - Mulkchi',
        description:
          "Mulkchi platformasi maxfiylik siyosati. Ma'lumotlaringiz xavfsizligi biz uchun muhim.",
        keywords: ['maxfiylik', 'siyosat', 'xavfsizlik'],
        type: 'website',
        noIndex: true,
      },
      terms: {
        title: 'Foydalanish shartlari - Mulkchi',
        description: 'Mulkchi platformasi foydalanish shartlari va qoidalar.',
        keywords: ['shartlar', 'qoidalar', 'foydalanish'],
        type: 'website',
        noIndex: true,
      },
      help: {
        title: 'Yordam - Mulkchi',
        description: "Mulkchi platformasidan foydalanish bo'yicha yordam va qo'llanma.",
        keywords: ['yordam', "qo'llanma", 'savollar'],
        type: 'website',
      },
    };

    const meta = pages[page];
    if (meta) {
      this.updateMetaTags(meta);
    }
  }

  addStructuredData(data: object): void {
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  addBreadcrumbStructuredData(items: { name: string; url: string }[]): void {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    this.addStructuredData(data);
  }

  addOrganizationStructuredData(): void {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: this.siteUrl,
      logo: `${this.siteUrl}/assets/logo.png`,
      sameAs: [
        'https://facebook.com/mulkchi',
        'https://instagram.com/mulkchi',
        'https://telegram.com/mulkchi',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+998-71-123-4567',
        contactType: 'customer service',
      },
    };

    this.addStructuredData(data);
  }
}
