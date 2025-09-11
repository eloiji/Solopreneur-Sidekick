
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { UploadedImage, GeneratedContent } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const productListingSchema = {
    type: Type.OBJECT,
    properties: {
        productTitle: {
            type: Type.STRING,
            description: "A clear, concise, and searchable product title, maximum 60 characters."
        },
        productDescription: {
            type: Type.OBJECT,
            properties: {
                hook: { 
                    type: Type.STRING, 
                    description: "A compelling 1-2 sentence hook to grab attention." 
                },
                features: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of 3-5 key features and their benefits, using action-oriented language."
                },
                cta: { 
                    type: Type.STRING, 
                    description: "A strong call to action to encourage purchase."
                },
            },
            required: ["hook", "features", "cta"]
        },
    },
    required: ["productTitle", "productDescription"]
};


const socialMediaPostSchema = {
    type: Type.OBJECT,
    properties: {
        hook: {
            type: Type.STRING,
            description: "A catchy title or hook for the social media post, different from the product title."
        },
        body: {
            type: Type.STRING,
            description: "A brief, engaging paragraph (1-3 sentences) for the target audience."
        },
        hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-5 relevant and trending hashtags."
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A detailed, creative, and photorealistic prompt to generate a square image for this social media post. The prompt should describe a scene that is visually appealing and relevant to the product and post content. Describe the style, subject, and environment. For example: 'A flat lay of a digital planner on a clean, minimalist desk with a cup of coffee, a succulent, and stylish gold pens. The lighting is bright and airy.'"
        }
    },
    required: ["hook", "body", "hashtags", "imagePrompt"]
};


export const checkContentSafety = async (productType: string, coreBenefit: string): Promise<boolean> => {
    const moderationPrompt = `Is the following product description safe for work and generally family-friendly? Answer with only "SAFE" or "UNSAFE".\n\nProduct Type: ${productType}\nBenefit: ${coreBenefit}`;
    try {
        const moderationResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: moderationPrompt }] },
            config: {
                temperature: 0,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return moderationResponse.text.includes('SAFE');
    } catch (error) {
        console.error("Content safety check failed:", error);
        return false;
    }
};

// Internal helper to generate scene descriptions
async function _generateSceneDescriptions(productTitle: string, productType: string, coreBenefit: string, count: number): Promise<string[]> {
    const sceneDescriptionPrompt = `Based on the product "${productTitle}", which is a ${productType} that helps with "${coreBenefit}", briefly describe ${count} different, creative, and photorealistic lifestyle scenes where this product is being actively used by Filipino or Asian people. Each description should be a single, concise sentence focusing on a unique context (e.g., home office, on-the-go, creative studio, cozy evening). Return ONLY a valid JSON array of ${count} strings, with no other text or markdown. Example: ["scene 1", "scene 2", ...]`;

    const sceneSchema = { type: Type.ARRAY, items: { type: Type.STRING } };

    try {
        const sceneResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: sceneDescriptionPrompt }] },
            config: { responseMimeType: "application/json", responseSchema: sceneSchema }
        });
        const parsedScenes = JSON.parse(sceneResponse.text.trim());
        if (Array.isArray(parsedScenes) && parsedScenes.length > 0 && parsedScenes.every(s => typeof s === 'string')) {
            return parsedScenes.slice(0, count);
        } else {
            throw new Error("Invalid scene description format from AI.");
        }
    } catch (e) {
        console.error("Failed to get valid scene descriptions, using fallbacks.", e);
        return Array.from({ length: count }, (_, i) => `A photorealistic scene of a Filipino or Asian person using the product in a modern setting #${i + 1}.`);
    }
}

// Internal helper to generate usage images from scenes
async function _generateUsageImages(image: UploadedImage, sceneDescriptions: string[], productType: string): Promise<string[]> {
    const usageImagePromises = sceneDescriptions.map(scene => {
        const usagePrompt = `Take the product from the user-provided image and seamlessly integrate it into the following photorealistic lifestyle scene featuring Filipino or Asian people: "${scene}". The product is a "${productType}", so ensure its size is realistic and proportional to the environment. The final image must be high-quality, square, and maintain a consistent, appealing aesthetic. Do not add any text, logos, or watermarks to the image. The product should look like it naturally belongs in the environment.`;
        return ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: usagePrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
    });

    const usageImageResults = await Promise.allSettled(usageImagePromises);
    const successfulImages: string[] = [];

    usageImageResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const resp = result.value;
            const usageImagePart = resp.candidates?.[0]?.content?.parts.find(part => part.inlineData);
            if (usageImagePart?.inlineData) {
                successfulImages.push(usageImagePart.inlineData.data);
            } else {
                console.warn(`AI fulfilled request for image #${index + 1} but returned no image data.`);
            }
        } else {
            console.error(`Failed to generate usage example image #${index + 1}:`, result.reason);
        }
    });

    if (sceneDescriptions.length > 0 && successfulImages.length === 0) {
        throw new Error("The AI failed to generate any usage example images. This could be due to content safety filters or a temporary issue. Please try a different product or image.");
    }
    
    return successfulImages;
}

// Generates just the Product Listing title and description
async function _generateProductListing(productType: string, coreBenefit: string): Promise<Pick<GeneratedContent, 'productTitle' | 'productDescription'>> {
    const prompt = `
        You are an expert e-commerce content creator. Based on the product information, generate a product listing title and description.
        - Product Type: ${productType}
        - Core Feature/Benefit: ${coreBenefit}
        Respond with a valid JSON object matching the defined schema.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema: productListingSchema }
    });
    return JSON.parse(response.text.trim());
}

// Generates just the initial Social Media Post
async function _generateInitialSocialPost(image: UploadedImage, productType: string, coreBenefit: string): Promise<Pick<GeneratedContent, 'socialMediaPost'>> {
    const prompt = `
        You are a witty and expert social media manager. Create a professional, engaging, and witty social media post in English for a general audience.
        - Product Type: ${productType}
        - Core Feature/Benefit: ${coreBenefit}
        Respond with a valid JSON object matching the defined schema.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            socialMediaPost: {
                type: Type.ARRAY,
                description: "An array containing one initial social media post object.",
                items: socialMediaPostSchema
            }
        },
        required: ["socialMediaPost"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    
    const content = JSON.parse(response.text.trim());
    
    if (content.socialMediaPost && content.socialMediaPost.length > 0) {
        const post = content.socialMediaPost[0];
        if (post.imagePrompt) {
            try {
                const socialImagePrompt = `Take the product from the user-provided image and seamlessly integrate it into the following photorealistic lifestyle scene, suitable for a social media post: "${post.imagePrompt}". The product is a "${productType}" that helps with "${coreBenefit}". The final image must be high-quality, square, and have a vibrant, eye-catching aesthetic suitable for social media. Do not add any text, logos, or watermarks.`;
                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: socialImagePrompt }] },
                    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
                });

                const imagePart = imageResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
                if (imagePart?.inlineData) {
                  post.imageBase64 = imagePart.inlineData.data;
                }
            } catch (e) {
                console.error("Failed to generate social media image for initial post:", e);
                // Gracefully fail, post can be displayed without an image.
            }
            delete post.imagePrompt;
        }
    }
    return content;
}

export const generateProductContent = async (
  image: UploadedImage,
  productType: string,
  coreBenefit: string,
  options: { productListing: boolean; socialMedia: boolean; images: boolean; }
): Promise<GeneratedContent> => {
    const result: GeneratedContent = {};
    let productTitleForImages: string | undefined;

    // Step 1: Generate text content in parallel
    const textPromises: Promise<Partial<GeneratedContent>>[] = [];
    if (options.productListing) {
        textPromises.push(_generateProductListing(productType, coreBenefit));
    }
    if (options.socialMedia) {
        textPromises.push(_generateInitialSocialPost(image, productType, coreBenefit));
    }

    if (textPromises.length > 0) {
        const textResults = await Promise.all(textPromises);
        textResults.forEach(res => Object.assign(result, res));
    }

    productTitleForImages = result.productTitle || productType;

    // Step 2: Generate images if requested
    let mainImagePromise: Promise<any> = Promise.resolve(undefined);
    let usageImagesPromise: Promise<string[] | undefined> = Promise.resolve(undefined);

    if (options.images) {
        const imageEditPrompt = `Using the user-provided image of a "${productType}", professionally extract the product and place it on a seamless, pure white background. The final image should be a minimalist, high-quality, well-lit studio product photograph. The product must be centered. The final image must be square. Do not add any text, logos, or watermarks.`;
        
        mainImagePromise = ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: imageEditPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        usageImagesPromise = _generateSceneDescriptions(productTitleForImages, productType, coreBenefit, 4)
            .then(scenes => _generateUsageImages(image, scenes, productType));
    }
    
    const [mainImageResponse, usageImages] = await Promise.all([mainImagePromise, usageImagesPromise]);
    
    if (mainImageResponse) {
        const imagePart = mainImageResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (!imagePart?.inlineData) {
            if (options.images) throw new Error("The AI failed to generate an edited product image.");
        } else {
            result.productImageBase64 = imagePart.inlineData.data;
        }
    }
    
    if (usageImages) {
        result.usageImagesBase64 = usageImages;
    }

    if (Object.keys(result).length === 0) {
        throw new Error("No content was generated. Please check your selections.");
    }

    return result;
};


export const generateMoreUsageImages = async (
  image: UploadedImage,
  productTitle: string,
  productType: string,
  coreBenefit: string
): Promise<string[]> => {
    const sceneDescriptions = await _generateSceneDescriptions(productTitle, productType, coreBenefit, 4);
    return await _generateUsageImages(image, sceneDescriptions, productType);
};

export const generateNewSocialMediaPost = async (
  image: UploadedImage,
  productTitle: string,
  productType: string,
  coreBenefit: string
): Promise<{ hook: string; body: string; hashtags: string[]; imageBase64?: string; }> => {
  const postGenPrompt = `
    You are a witty and expert social media manager.
    Create a completely new, engaging, and witty social media post in English for the following product. Ensure it is different from previous posts.

    Product Information:
    - Product Name: ${productTitle}
    - Product Type: ${productType}
    - Core Benefit: ${coreBenefit}
    
    Respond with ONLY a valid JSON object matching the defined schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: postGenPrompt }] },
    config: { responseMimeType: "application/json", responseSchema: socialMediaPostSchema }
  });

  const postContent = JSON.parse(response.text.trim());
  const { imagePrompt } = postContent;

  if (imagePrompt) {
      try {
          const socialImagePrompt = `Take the product from the user-provided image and seamlessly integrate it into the following photorealistic lifestyle scene, suitable for a social media post: "${imagePrompt}". The product is a "${productType}" that helps with "${coreBenefit}". The final image must be high-quality, square, and have a vibrant, eye-catching aesthetic suitable for social media. Do not add any text, logos, or watermarks.`;
          const imageResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image-preview',
              contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: socialImagePrompt }] },
              config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
          });
          const imagePart = imageResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
          if (imagePart?.inlineData) {
              postContent.imageBase64 = imagePart.inlineData.data;
          }
      } catch (e) {
          console.error("Failed to generate new social media image:", e);
      }
  }

  delete postContent.imagePrompt;
  return postContent;
};

export const generateTaglishSocialMediaPost = async (
    image: UploadedImage,
    productTitle: string,
    productType: string,
    coreBenefit: string
  ): Promise<{ hook: string; body: string; hashtags: string[]; imageBase64?: string; }> => {
    const postGenPrompt = `
      You are a witty and humorous social media manager with a knack for Filipino humor.
      Create a completely new and funny social media post in Taglish for the following product. Ensure it's different from previous posts.
  
      Product Information:
      - Product Name: ${productTitle}
      - Product Type: ${productType}
      - Core Benefit: ${coreBenefit}
      
      Respond with ONLY a valid JSON object matching the defined schema.`;
  
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: postGenPrompt }] },
      config: { responseMimeType: "application/json", responseSchema: socialMediaPostSchema }
    });
  
    const postContent = JSON.parse(response.text.trim());
    const { imagePrompt } = postContent;

    if (imagePrompt) {
        try {
            const socialImagePrompt = `Take the product from the user-provided image and seamlessly integrate it into the following photorealistic lifestyle scene, suitable for a social media post: "${imagePrompt}". The product is a "${productType}" that helps with "${coreBenefit}". The final image must be high-quality, square, and have a vibrant, eye-catching aesthetic suitable for social media. Do not add any text, logos, or watermarks.`;
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: socialImagePrompt }] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            const imagePart = imageResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
            if (imagePart?.inlineData) {
                postContent.imageBase64 = imagePart.inlineData.data;
            }
        } catch (e) {
            console.error("Failed to generate Taglish social media image:", e);
        }
    }

    delete postContent.imagePrompt;
    return postContent;
  };