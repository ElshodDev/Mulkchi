
export interface Announcement {
  id: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  contentUz: string;
  contentRu: string;
  contentEn: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  isActive: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  createdBy: string;
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;
}

export interface CreateAnnouncementRequest {
  Id: string;
  CreatedBy: string;
  TitleUz: string;
  TitleRu: string;
  TitleEn: string;
  ContentUz: string;
  ContentRu: string;
  ContentEn: string;
  Type: AnnouncementType;
  Target: AnnouncementTarget;
  IsActive: boolean;
  PublishedAt?: Date;
  ExpiresAt?: Date;
}

export type UpdateAnnouncementRequest = CreateAnnouncementRequest;

export enum AnnouncementType {
  General = 'General',
  Maintenance = 'Maintenance',
  Promotion = 'Promotion',
  PolicyUpdate = 'PolicyUpdate',
}

export enum AnnouncementTarget {
  AllUsers = 'AllUsers',
  Hosts = 'Hosts',
  Guests = 'Guests',
  Admins = 'Admins',
}

export interface AnnouncementDisplay {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  publishedAt?: Date;
  expiresAt?: Date;
  isExpired: boolean;
}
