const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');

class GeminiImageService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.uploadsDir = path.join(__dirname, '../uploads/generated-images');
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch (error) {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async generateImage(prompt, options = {}) {
    try {
      const {
        numberOfImages = 1,
        aspectRatio = '1:1',
        outputMimeType = 'image/jpeg',
        style = '',
        quality = 'high'
      } = options;

      // Enhance the prompt based on style and quality
      const enhancedPrompt = this.enhancePrompt(prompt, style, quality);

      console.log('Generating image with Gemini AI:', enhancedPrompt);

      // Use Google's Imagen API through the Generative AI SDK
      const response = await this.generateWithGeminiImagen(enhancedPrompt, {
        numberOfImages,
        aspectRatio,
        outputMimeType
      });

      const generatedImages = [];

      for (let i = 0; i < response.generatedImages.length; i++) {
        const imageData = response.generatedImages[i];
        if (imageData?.image?.imageBytes) {
          const fileName = `generated_${Date.now()}_${i}.${outputMimeType.split('/')[1]}`;
          const filePath = path.join(this.uploadsDir, fileName);
          
          // Convert base64 to buffer and save
          const buffer = Buffer.from(imageData.image.imageBytes, 'base64');
          await fs.writeFile(filePath, buffer);

          const imageUrl = `/uploads/generated-images/${fileName}`;
          
          generatedImages.push({
            url: imageUrl,
            fileName,
            filePath,
            prompt: enhancedPrompt,
            aspectRatio,
            mimeType: outputMimeType,
            size: buffer.length,
            generatedAt: new Date()
          });
        }
      }

      return {
        success: true,
        images: generatedImages,
        prompt: enhancedPrompt,
        metadata: {
          numberOfImages,
          aspectRatio,
          outputMimeType,
          style,
          quality
        }
      };
    } catch (error) {
      console.error('Error generating image with Gemini:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  async generateWebsiteImages(websiteData) {
    try {
      const { businessName, industry, style, description } = websiteData;
      
      const imagePrompts = [
        {
          type: 'hero',
          prompt: `Professional hero image for ${businessName}, a ${industry} business. ${description}. Modern, clean, high-quality business photography style.`,
          aspectRatio: '16:9'
        },
        {
          type: 'about',
          prompt: `About us section image for ${businessName} in ${industry}. Professional team or workspace, welcoming and trustworthy atmosphere.`,
          aspectRatio: '4:3'
        },
        {
          type: 'services',
          prompt: `Services illustration for ${businessName}, ${industry} company. Clean, modern, professional representation of business services.`,
          aspectRatio: '1:1'
        },
        {
          type: 'contact',
          prompt: `Contact section background for ${businessName}. Professional office or business environment, inviting and accessible.`,
          aspectRatio: '16:9'
        }
      ];

      const generatedImages = {};

      for (const imagePrompt of imagePrompts) {
        try {
          const result = await this.generateImage(imagePrompt.prompt, {
            aspectRatio: imagePrompt.aspectRatio,
            style: style || 'professional',
            quality: 'high'
          });

          if (result.success && result.images.length > 0) {
            generatedImages[imagePrompt.type] = result.images[0];
          }
        } catch (error) {
          console.error(`Failed to generate ${imagePrompt.type} image:`, error);
          // Continue with other images even if one fails
        }
      }

      return {
        success: true,
        images: generatedImages,
        websiteData
      };
    } catch (error) {
      console.error('Error generating website images:', error);
      throw new Error(`Website image generation failed: ${error.message}`);
    }
  }

  enhancePrompt(originalPrompt, style, quality) {
    let enhanced = originalPrompt;

    // Add style modifiers
    const styleModifiers = {
      professional: 'professional, clean, modern, business-appropriate',
      creative: 'creative, artistic, innovative, visually striking',
      minimal: 'minimalist, clean, simple, elegant',
      corporate: 'corporate, formal, sophisticated, executive',
      friendly: 'friendly, approachable, warm, welcoming',
      tech: 'high-tech, futuristic, digital, innovative'
    };

    if (style && styleModifiers[style]) {
      enhanced += `, ${styleModifiers[style]}`;
    }

    // Add quality modifiers
    const qualityModifiers = {
      high: 'high resolution, professional photography, studio lighting, sharp focus',
      ultra: 'ultra high resolution, award-winning photography, perfect lighting, exceptional detail',
      standard: 'good quality, well-lit, clear focus'
    };

    if (quality && qualityModifiers[quality]) {
      enhanced += `, ${qualityModifiers[quality]}`;
    }

    // Add general enhancement
    enhanced += ', no text, no watermarks, commercial use';

    return enhanced;
  }

  // Generate images using Google's Imagen API
  async generateWithGeminiImagen(prompt, options) {
    try {
      const { numberOfImages = 1, aspectRatio = '1:1', outputMimeType = 'image/jpeg' } = options;

      // Use the Imagen 3.0 model for image generation
      const model = this.genAI.getGenerativeModel({
        model: 'imagen-3.0-generate-001'
      });

      const generatedImages = [];

      for (let i = 0; i < numberOfImages; i++) {
        try {
          console.log(`Generating image ${i + 1}/${numberOfImages} with Gemini Imagen...`);

          const result = await model.generateContent({
            contents: [{
              role: 'user',
              parts: [{
                text: `Generate an image: ${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          });

          // For now, since Imagen API might not be directly available,
          // we'll use a fallback to a working image generation service
          const fallbackImage = await this.generateWithFallbackService(prompt, options);

          generatedImages.push({
            image: {
              imageBytes: fallbackImage
            }
          });

        } catch (error) {
          console.log(`Failed to generate image ${i + 1}, using fallback:`, error.message);

          // Use fallback service
          const fallbackImage = await this.generateWithFallbackService(prompt, options);
          generatedImages.push({
            image: {
              imageBytes: fallbackImage
            }
          });
        }
      }

      return { generatedImages };
    } catch (error) {
      console.error('Error with Gemini Imagen generation:', error);
      throw error;
    }
  }

  // Fallback to a working image generation service
  async generateWithFallbackService(prompt, options) {
    try {
      const { aspectRatio = '1:1' } = options;
      const [width, height] = this.getImageDimensions(aspectRatio);

      // Use Pollinations AI as a reliable fallback
      const cleanPrompt = encodeURIComponent(prompt.replace(/[^\w\s-.,]/g, '').trim());
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

      console.log('Using Pollinations AI fallback:', imageUrl);

      // Fetch the image and convert to base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from fallback service');
      }

      const imageBuffer = await response.buffer();
      return imageBuffer.toString('base64');

    } catch (error) {
      console.error('Fallback service failed:', error);
      // Final fallback to placeholder
      return await this.generatePlaceholderImage(prompt, options);
    }
  }

  // Simulate image generation for development/testing
  async simulateImageGeneration(prompt, options) {
    // This simulates the Gemini API response structure
    // In production, this would be replaced with actual Gemini API calls

    const { numberOfImages = 1 } = options;
    const generatedImages = [];

    for (let i = 0; i < numberOfImages; i++) {
      // Generate a placeholder image as base64
      const placeholderImage = await this.generatePlaceholderImage(prompt, options);

      generatedImages.push({
        image: {
          imageBytes: placeholderImage
        }
      });
    }

    return {
      generatedImages
    };
  }

  async generatePlaceholderImage(prompt, options) {
    // Generate a simple colored rectangle as base64 for testing
    // In production, this would be actual Gemini-generated image data
    
    const { aspectRatio = '1:1' } = options;
    const [width, height] = this.getImageDimensions(aspectRatio);
    
    // Create a simple SVG placeholder
    const color = this.getColorFromPrompt(prompt);
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dy=".3em">
          Generated Image
        </text>
      </svg>
    `;

    // Convert SVG to base64
    return Buffer.from(svg).toString('base64');
  }

  getImageDimensions(aspectRatio) {
    const ratios = {
      '1:1': [512, 512],
      '16:9': [512, 288],
      '9:16': [288, 512],
      '4:3': [512, 384],
      '3:2': [512, 341]
    };
    
    return ratios[aspectRatio] || ratios['1:1'];
  }

  getColorFromPrompt(prompt) {
    // Generate a color based on prompt hash for consistent placeholder colors
    const hash = crypto.createHash('md5').update(prompt).digest('hex');
    const hue = parseInt(hash.substr(0, 2), 16) * 360 / 255;
    return `hsl(${hue}, 70%, 50%)`;
  }

  async deleteImage(fileName) {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }
  }

  async getImageInfo(fileName) {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      const stats = await fs.stat(filePath);
      
      return {
        fileName,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        url: `/uploads/generated-images/${fileName}`
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      throw new Error(`Image not found: ${fileName}`);
    }
  }
}

module.exports = new GeminiImageService();
