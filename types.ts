export interface UploadedImage {
  base64: string;
  mimeType: string;
}

export interface GeneratedContent {
  productTitle?: string;
  productDescription?: {
    hook: string;
    features: string[];
    cta: string;
  };
  socialMediaPost?: {
    hook: string;
    body: string;
    hashtags: string[];
    imageBase64?: string;
  }[];
  productImageBase64?: string;
  usageImagesBase64?: string[];
}
