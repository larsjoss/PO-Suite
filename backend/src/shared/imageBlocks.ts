import type Anthropic from '@anthropic-ai/sdk';

export type ImageMedia = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ImageInput {
  base64: string;
  mediaType: ImageMedia;
}

export function buildImageBlock(base64: string, mediaType: ImageMedia): Anthropic.Messages.ImageBlockParam {
  return {
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data: base64 },
  };
}

export function buildImageBlocks(images: ImageInput[]): Anthropic.Messages.ImageBlockParam[] {
  return images.map((img) => buildImageBlock(img.base64, img.mediaType));
}
