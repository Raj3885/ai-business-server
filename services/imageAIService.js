const Groq = require('groq-sdk');

class ImageAIService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async generatePrompt(requirements) {
    try {
      const prompt = `You are an expert AI image prompt engineer. Create a detailed, specific prompt for AI image generation based on these requirements:

Requirements: ${JSON.stringify(requirements)}

Generate a detailed prompt that includes:
- Main subject and composition
- Style and artistic direction
- Lighting and mood
- Technical specifications
- Quality descriptors

Return only the prompt text, no explanations.`;

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 500
      });

      const generatedPrompt = completion.choices[0]?.message?.content?.trim();
      
      return {
        success: true,
        prompt: generatedPrompt,
        originalRequirements: requirements,
        enhancedPrompt: this.enhancePrompt(generatedPrompt, requirements.style),
        metadata: {
          model: 'llama3-8b-8192',
          generatedAt: new Date(),
          requirements
        }
      };
    } catch (error) {
      console.error('Error generating prompt:', error);
      throw new Error(`Prompt generation failed: ${error.message}`);
    }
  }

  async enhancePrompt(basePrompt, style = 'realistic') {
    const styleEnhancements = {
      realistic: 'photorealistic, high quality, detailed, professional photography',
      artistic: 'artistic, creative, stylized, expressive',
      cartoon: 'cartoon style, animated, colorful, playful',
      sketch: 'pencil sketch, hand drawn, artistic, monochrome',
      digital: 'digital art, modern, clean, vector style',
      vintage: 'vintage, retro, aged, classic photography',
      minimalist: 'minimalist, clean, simple, elegant composition'
    };

    const enhancement = styleEnhancements[style] || styleEnhancements.realistic;
    return `${basePrompt}, ${enhancement}, high resolution, masterpiece`;
  }

  async analyzeConcepts(description) {
    try {
      const prompt = `Analyze this image concept and provide creative suggestions:

Description: "${description}"

Provide a JSON response with:
{
  "mainConcepts": ["concept1", "concept2", "concept3"],
  "styleVariations": ["style1", "style2", "style3"],
  "compositionIdeas": ["composition1", "composition2", "composition3"],
  "colorPalettes": ["palette1", "palette2", "palette3"],
  "moodSuggestions": ["mood1", "mood2", "mood3"],
  "technicalTips": ["tip1", "tip2", "tip3"]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.8,
        max_tokens: 800
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      try {
        const analysis = JSON.parse(response);
        return {
          success: true,
          analysis,
          originalDescription: description,
          generatedAt: new Date()
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          success: true,
          analysis: {
            mainConcepts: ['Creative concept', 'Artistic vision', 'Visual storytelling'],
            styleVariations: ['Realistic', 'Artistic', 'Abstract'],
            compositionIdeas: ['Centered composition', 'Rule of thirds', 'Dynamic angle'],
            colorPalettes: ['Warm tones', 'Cool tones', 'Monochromatic'],
            moodSuggestions: ['Inspiring', 'Peaceful', 'Dynamic'],
            technicalTips: ['High resolution', 'Good lighting', 'Sharp focus']
          },
          originalDescription: description,
          generatedAt: new Date(),
          fallback: true
        };
      }
    } catch (error) {
      console.error('Error analyzing concepts:', error);
      throw new Error(`Concept analysis failed: ${error.message}`);
    }
  }

  async generateImageVariations(basePrompt, count = 4) {
    try {
      const variations = [];
      
      const styleModifiers = [
        'photorealistic, professional photography',
        'artistic, painterly style',
        'digital art, modern illustration',
        'cinematic, dramatic lighting'
      ];

      for (let i = 0; i < count; i++) {
        const modifier = styleModifiers[i % styleModifiers.length];
        const enhancedPrompt = `${basePrompt}, ${modifier}, high quality, detailed`;
        
        variations.push({
          id: i + 1,
          prompt: enhancedPrompt,
          style: modifier.split(',')[0],
          seed: Math.floor(Math.random() * 1000000)
        });
      }

      return {
        success: true,
        variations,
        basePrompt,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating variations:', error);
      throw new Error(`Variation generation failed: ${error.message}`);
    }
  }

  async optimizePrompt(prompt, targetStyle, aspectRatio) {
    try {
      const optimizationPrompt = `Optimize this image generation prompt for better results:

Original prompt: "${prompt}"
Target style: ${targetStyle}
Aspect ratio: ${aspectRatio}

Improve the prompt by:
1. Adding specific technical details
2. Enhancing style descriptors
3. Including composition guidance
4. Adding quality modifiers

Return only the optimized prompt, no explanations.`;

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: optimizationPrompt }],
        model: 'llama3-8b-8192',
        temperature: 0.6,
        max_tokens: 400
      });

      const optimizedPrompt = completion.choices[0]?.message?.content?.trim();
      
      return {
        success: true,
        originalPrompt: prompt,
        optimizedPrompt,
        targetStyle,
        aspectRatio,
        improvements: [
          'Enhanced technical specifications',
          'Improved style descriptors',
          'Better composition guidance',
          'Quality modifiers added'
        ],
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      throw new Error(`Prompt optimization failed: ${error.message}`);
    }
  }

  async generateImageMetadata(prompt, style, dimensions) {
    return {
      prompt,
      style,
      dimensions,
      suggestedSettings: {
        steps: style === 'realistic' ? 30 : 20,
        guidance: style === 'artistic' ? 12 : 7.5,
        sampler: 'DPM++ 2M Karras'
      },
      qualityTags: ['high resolution', 'detailed', 'professional'],
      estimatedTime: '30-60 seconds',
      generatedAt: new Date()
    };
  }

  // Helper method to validate prompts
  validatePrompt(prompt) {
    if (!prompt || prompt.trim().length < 10) {
      return {
        valid: false,
        error: 'Prompt must be at least 10 characters long'
      };
    }

    if (prompt.length > 1000) {
      return {
        valid: false,
        error: 'Prompt must be less than 1000 characters'
      };
    }

    return { valid: true };
  }

  // Helper method to get style recommendations
  getStyleRecommendations(category) {
    const recommendations = {
      photography: ['Portrait', 'Landscape', 'Street', 'Macro', 'Documentary'],
      art: ['Oil painting', 'Watercolor', 'Digital art', 'Sketch', 'Abstract'],
      design: ['Logo', 'Icon', 'Poster', 'Banner', 'Infographic'],
      illustration: ['Character', 'Concept art', 'Children\'s book', 'Technical', 'Fashion']
    };

    return recommendations[category] || recommendations.art;
  }

  // Method to get generation statistics
  getServiceInfo() {
    return {
      name: 'Image AI Service',
      version: '1.0.0',
      capabilities: [
        'Prompt generation',
        'Concept analysis',
        'Style variations',
        'Prompt optimization'
      ],
      supportedStyles: [
        'realistic', 'artistic', 'cartoon', 'sketch', 
        'digital', 'vintage', 'minimalist'
      ],
      maxPromptLength: 1000,
      status: 'active'
    };
  }
}

module.exports = new ImageAIService();
