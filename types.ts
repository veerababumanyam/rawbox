
export interface Face {
  id: string;
  box: { x: number; y: number; w: number; h: number }; // Percentage relative to image
  personId?: string; // Link to a Person entity
}

export interface Person {
  id: string;
  name: string;
  thumbnailUrl: string;
  photoCount: number;
  createdAt?: string;
  coverPhotoUrl?: string;
}

export interface ClientAddress {
  line1?: string;
  line2?: string;
  street?: string; // Deprecated, mapped to line1
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timeZone?: string;
}

export interface ContactEntry {
  type: string; // 'work', 'home', 'mobile', 'main', 'other'
  value: string;
  isPrimary?: boolean;
}

// Reuse Profile Types for consistency
export interface ProfileSocials {
  instagram: string;
  facebook: string;
  whatsapp: string;
  spotify: string;
  twitter: string;
  tiktok: string;
  linkedin: string;
  snapchat: string;
  youtube: string;
}

export interface ProfileCustomLink {
  id: string;
  label: string;
  url: string;
  logoUrl?: string; // Optional custom logo for the link
}

export interface Client {
  id: string;

  // Identity
  displayName: string; // Full formatted name
  firstName: string;
  lastName: string;
  middleName?: string;
  prefix?: string;
  nickname?: string;

  // Visuals
  avatarUrl?: string;
  organizationLogoUrl?: string;

  // Personal Dates
  birthDate?: string;
  anniversaryDate?: string;
  genderIdentity?: string;

  // Location
  address?: ClientAddress;

  // Professional
  organization?: string;
  department?: string;
  jobTitle?: string;
  professionalRole?: string;

  // Meta & Classification
  tags?: string[];
  notes?: string;
  lastRevision?: string;

  // Contact
  phones: ContactEntry[];
  emails: ContactEntry[];
  imHandles?: ContactEntry[]; // Instant messaging handles
  websites?: ContactEntry[];

  // Extended Socials & Links
  socials?: ProfileSocials;
  customLinks?: ProfileCustomLink[];

  // Preferences
  preferredLanguage?: string; // Primary language
  languages?: string[]; // Multiple languages spoken
  preferredContactMethod?: string;

  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export type MediaType = 'photo' | 'video';

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  title?: string;
  description?: string;
  width: number;
  height: number;
  tags?: string[];

  // New Media Properties
  type: MediaType;
  videoUrl?: string; // For video items
  duration?: number; // In seconds
  isFavorite?: boolean;
  favoritedBy?: string[]; // Emails of clients who liked this photo

  // Client Selection / Proofing
  isPicked?: boolean; // True if the client has "ticked" or selected this photo for the photographer

  viewCount?: number;

  // Privacy & Access Control
  privacy?: 'public' | 'private';
  accessCode?: string; // Unique code required to unlock this specific item
  isUnlocked?: boolean; // Client-side state: true if user has entered code
  allowDownload?: boolean; // Override album settings (e.g., false for exclusive previews)

  // Trimming
  trimStart?: number; // Start time in seconds
  trimEnd?: number;   // End time in seconds

  // Status (Active vs Trash)
  status: 'active' | 'trash';
  deletedAt?: string; // ISO Date string for when it was moved to trash

  // AI Analysis
  aiAnalysis?: string; // Deprecated
  aiDescription?: string;
  aiTags?: string[];
  aiStatus?: 'idle' | 'analyzing' | 'complete' | 'failed';

  // Face Detection
  faces?: Face[];
  peopleIds?: string[]; // IDs of people detected in this photo

  // Scheduling & Lifecycle
  scheduledDeleteAt?: string; // ISO Date string
  publicExpiryAt?: string;    // ISO Date string

  // Sub-gallery / Section (Renamed from subAlbumId)
  subGalleryId?: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string; // New
  pinterest?: string; // New
}

export interface CustomLink {
  id: string;
  label: string;
  url: string;
  logoUrl?: string; // Optional custom logo for the link
}

export type WatermarkPosition = 'center' | 'repeat' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface BrandingSettings {
  brandName?: string;
  logoUrl?: string;
  tagline?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;

  // Watermark
  showWatermark: boolean;
  watermarkOpacity?: number; // 0.1 to 1.0
  watermarkPosition?: WatermarkPosition;
  watermarkLogoUrl?: string; // Override main logo for watermark

  // Theme
  primaryColor?: string;
  fontFamily?: string;

  socialLinks?: SocialLinks;
  customLinks?: CustomLink[];
}

export interface GallerySettings {
  isShared: boolean; // New: Master toggle for gallery visibility
  password?: string;
  isPasswordProtected: boolean;
  emailRegistration: boolean; // New: Capture emails before view
  customDomain?: string;      // New: photos.brand.com
  expiresAt?: string;
  allowDownload: boolean;
  showMetadata: boolean;
  theme: 'light' | 'dark' | 'auto';
  focalPointX: number; // 0-100%
  focalPointY: number; // 0-100%
  branding?: BrandingSettings; // New: Per-gallery branding
  clientLayout?: 'tabs' | 'continuous'; // New: Client view layout preference
}

export interface SubGallery {
  id: string;
  title: string;
  createdAt: string;
  coverUrl?: string;
  order: number;
  isShared?: boolean; // New: Independent toggle for sub-gallery
}

// --- DESIGN STUDIO TYPES ---

export interface LabPreset {
  id: string;
  name: string; // e.g., "Miller's Lab"
  specs: PrintSpecs;
}

export interface PrintSpecs {
  id: string;
  name: string; // e.g., "10x10 Square Album"
  width: number; // inches
  height: number; // inches
  bleed: number; // inches
  safeZone: number; // inches
  dpi: number; // usually 300
}

export interface ImageTransform {
  x: number; // Offset X within frame (px)
  y: number; // Offset Y within frame (px)
  scale: number; // Zoom level (1.0 = fit/cover)
}

export interface FilterSettings {
  grayscale?: number; // 0-100
  sepia?: number; // 0-100
  brightness?: number; // 100 is default
  contrast?: number; // 100 is default
  blur?: number; // px
}

export interface DesignElement {
  id: string;
  type: 'photo' | 'text' | 'shape';
  photoId?: string; // If type is photo
  text?: string; // If type is text
  x: number; // Percentage (0-100) relative to spread
  y: number; // Percentage (0-100)
  width: number; // Percentage
  height: number; // Percentage
  rotation: number; // Degrees
  zIndex: number;

  // Photo Specific
  imageTransform?: ImageTransform;
  filters?: FilterSettings;
  mask?: 'none' | 'circle' | 'rounded';

  // Style properties
  style?: {
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    shadow?: boolean;

    // Text Specific
    fontFamily?: string;
    fontSize?: number; // px relative to canvas base
    fontWeight?: string; // 'normal' | 'bold'
    fontStyle?: string; // 'normal' | 'italic'
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number; // em
    lineHeight?: number;
    uppercase?: boolean;

    backgroundColor?: string;
  };
}

export interface LayoutTemplate {
  id: string;
  name: string;
  category: 'one' | 'two' | 'three' | 'grid' | 'creative';
  elements: Omit<DesignElement, 'id' | 'photoId' | 'text'>[]; // Schematic elements
}

export interface SpreadComment {
  id: string;
  author: string; // "Client" or "Photographer"
  text: string;
  createdAt: string;
  isResolved: boolean;
  elementId?: string; // Link comment to specific photo
  x?: number; // Pin position X
  y?: number; // Pin position Y
}

export interface AlbumSpread {
  id: string;
  order: number;
  elements: DesignElement[];
  background?: string; // hex or url
  comments: SpreadComment[];
  status: 'draft' | 'approved' | 'changes_requested';
}

export interface AlbumDesign {
  id: string;
  name: string; // e.g., "Main Album", "Parent Copy"
  specs: PrintSpecs;
  spreads: AlbumSpread[];
  cover?: AlbumSpread; // New: Dedicated cover spread
  globalStyles: {
    fontFamily: string;
    backgroundColor: string;
    spacing: number; // gap between photos
  };
  status: 'draft' | 'proofing' | 'locked';
  shareToken?: string; // Unique token for direct sharing
  lastModified: string;
}

// --- PROFILE TYPES ---

export interface ProfileAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PersonalProfile {
  nickname: string;
  firstName: string;
  lastName: string;
  contact: string; // General contact display string
  email: string;
  phone: string;
  website: string;
  photoUrl: string;
  address: ProfileAddress;
  languages: string[];
  socials: ProfileSocials;
  customLinks: ProfileCustomLink[];
}

export interface CompanyProfile {
  name: string; // Mandatory, unique
  tagline?: string; // New: Company tagline for branding
  slug?: string; // Custom public URL slug
  phone: string;
  email: string;
  logoUrl: string;
  website: string;
  address: ProfileAddress;
  languages: string[];
  socials: ProfileSocials;
  customLinks: ProfileCustomLink[];
}

export type VisibilityMap<T> = {
  [K in keyof T]?: boolean;
};

export type DeepVisibilityMap<T> = {
  [K in keyof T]?: T[K] extends Array<any> ? boolean : T[K] extends object ? DeepVisibilityMap<T[K]> : boolean;
};

// --- Theme & Appearance Types ---

export interface ThemeStyles {
  background: string; // CSS color or gradient
  surface: string;    // Card/Container background color
  textMain: string;   // Primary text color
  textMuted: string;  // Secondary text color
  accent: string;     // Buttons, Links, Icons color
  border: string;     // Border color
  font: string;       // Font Family
  radius: string;     // Border Radius (e.g. '0.5rem', '2rem')
}

export interface ProfileTheme {
  id: string;
  name: string;
  isPreset: boolean;
  values: ThemeStyles;
}

export interface PhotographerProfile {
  personal: PersonalProfile;
  personalVisibility: DeepVisibilityMap<PersonalProfile>;

  company: CompanyProfile;
  companyVisibility: DeepVisibilityMap<CompanyProfile>;

  settings: {
    isPublic: boolean;
    allowIndexing: boolean;
    publicUrl?: string;
    theme?: ProfileTheme; // Appearance Theme
  };
}

export interface IntegrationStatus {
  google: boolean; // Master google toggle
  googleCalendar: boolean;
  googleDrive: boolean;
  googlePhotos: boolean;
  dropbox: boolean;
  adobe: boolean;
  stripe: boolean;
  zoom: boolean;
  slack: boolean;
}

export interface Policies {
  termsOfService?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
}

// ---------------------------

export interface Album { // Represents a Root Gallery
  id: string;
  // Removed folderId to flatten hierarchy
  title: string;
  clientName: string;
  clientId?: string; // Linked Client ID
  date: string;
  coverUrl: string;
  photoCount: number;
  status: 'published' | 'draft' | 'archived';
  photos: Photo[];
  subGalleries?: SubGallery[]; // Renamed from subAlbums
  settings: GallerySettings;
  aiStory?: string; // New: AI generated story/summary
  isFavorite?: boolean; // New: Gallery Favorite state

  designs?: AlbumDesign[]; // New: Multiple designs support
}

export interface StudioDetails {
  // Legacy support
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logoUrl?: string;
  socials: SocialLinks;
}

export interface AppSettings {
  recycleBinRetentionDays: number;
  studioDetails: StudioDetails; // Keep for legacy compatibility if needed
  photographerProfile: PhotographerProfile; // New detailed profile
  integrations: IntegrationStatus; // New integrations
  galleryDefaults: BrandingSettings; // Global defaults for galleries
  policies?: Policies; // New policies module
}

export type ViewMode = 'grid' | 'masonry';
export type AppView = 'albums' | 'album-detail' | 'print-albums' | 'design-editor' | 'recycle-bin' | 'schedules' | 'clients' | 'client-detail' | 'people' | 'person-detail' | 'public-profile'
  | 'settings-public' | 'settings-brand' | 'settings-company' | 'settings-personal' | 'settings-integrations' | 'settings-policies';

export type AppLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml';

// --- AUTHENTICATION TYPES ---

export type UserRole = 'SuperAdmin' | 'Admin' | 'ProUser' | 'PowerUser' | 'User';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_SESSION = 'INVALID_SESSION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
