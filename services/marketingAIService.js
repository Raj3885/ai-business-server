const Groq = require('groq-sdk');

class MarketingAIService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async generateEmailCampaign(campaignData) {
    const { businessInfo, campaignType, audience, tone, goals, productInfo } = campaignData;
    
    const prompt = `
You are an expert email marketing copywriter. Create a compelling email campaign with the following details:

Business Information:
- Company: ${businessInfo.company || 'Our Company'}
- Industry: ${businessInfo.industry || 'General'}
- Brand Voice: ${tone || 'Professional and friendly'}

Campaign Details:
- Type: ${campaignType || 'promotional'}
- Target Audience: ${audience || 'general customers'}
- Goals: ${goals || 'increase engagement'}
- Product/Service: ${productInfo || 'our products and services'}

Please generate:
1. A compelling subject line (under 50 characters)
2. A preview text (under 90 characters)
3. HTML email content with proper structure
4. Plain text version
5. Call-to-action suggestions

Make the content engaging, personalized, and conversion-focused. Include proper email structure with header, body, and footer. Use modern email design principles.

Format your response as JSON:
{
  "subject": "subject line here",
  "previewText": "preview text here",
  "html": "full HTML email content here",
  "text": "plain text version here",
  "cta": ["CTA suggestion 1", "CTA suggestion 2", "CTA suggestion 3"]
}
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generating email campaign:', error);
      throw new Error('Failed to generate email campaign');
    }
  }

  async generateSocialMediaContent(contentData) {
    const { platform, businessInfo, contentType, topic, tone, hashtags } = contentData;
    
    const prompt = `
You are a social media marketing expert. Create engaging ${platform} content with these details:

Business Information:
- Company: ${businessInfo.company || 'Our Company'}
- Industry: ${businessInfo.industry || 'General'}
- Brand Voice: ${tone || 'Professional and engaging'}

Content Details:
- Platform: ${platform}
- Content Type: ${contentType || 'promotional post'}
- Topic: ${topic || 'general business update'}
- Suggested Hashtags: ${hashtags || 'relevant industry hashtags'}

Create content optimized for ${platform} with:
1. Engaging copy appropriate for the platform
2. Relevant hashtags
3. Call-to-action
4. Image/video suggestions

Platform-specific requirements:
- LinkedIn: Professional, thought leadership
- Instagram: Visual, lifestyle-focused
- Twitter: Concise, trending topics
- Facebook: Community-building, storytelling

Format as JSON:
{
  "content": "main post content here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "cta": "call to action",
  "imagePrompt": "description for image/video content",
  "bestTimeToPost": "suggested posting time",
  "engagementTips": ["tip1", "tip2", "tip3"]
}
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.8,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generating social media content:', error);
      throw new Error('Failed to generate social media content');
    }
  }

  async generateNewsletterContent(newsletterData) {
    const { businessInfo, topics, audience, frequency, tone } = newsletterData;
    
    const prompt = `
Create a comprehensive newsletter for ${businessInfo.company || 'our company'} with these specifications:

Business Context:
- Company: ${businessInfo.company || 'Our Company'}
- Industry: ${businessInfo.industry || 'General'}
- Audience: ${audience || 'customers and prospects'}
- Frequency: ${frequency || 'monthly'}
- Tone: ${tone || 'professional and informative'}

Newsletter Topics:
${topics.map(topic => `- ${topic}`).join('\n')}

Create a newsletter with:
1. Compelling subject line
2. Header section with greeting
3. Main content sections for each topic
4. Industry insights or tips
5. Company updates section
6. Call-to-action
7. Footer with social links

Make it valuable, informative, and engaging. Include proper HTML structure for email clients.

Format as JSON:
{
  "subject": "newsletter subject line",
  "html": "complete HTML newsletter content",
  "text": "plain text version",
  "sections": [
    {
      "title": "section title",
      "content": "section content",
      "type": "main|update|tip|cta"
    }
  ]
}
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 2500
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generating newsletter:', error);
      throw new Error('Failed to generate newsletter content');
    }
  }

  async generateAutomationSequence(sequenceData) {
    const { trigger, businessInfo, goals, audienceSegment, sequenceLength } = sequenceData;
    
    const prompt = `
Create an automated email sequence for ${businessInfo.company || 'our company'} with these parameters:

Business Information:
- Company: ${businessInfo.company || 'Our Company'}
- Industry: ${businessInfo.industry || 'General'}

Automation Details:
- Trigger: ${trigger}
- Goal: ${goals || 'nurture leads and increase conversions'}
- Audience: ${audienceSegment || 'new subscribers'}
- Sequence Length: ${sequenceLength || 5} emails
- Send Frequency: Every 2-3 days

Create a sequence that:
1. Welcomes and sets expectations
2. Provides value and builds trust
3. Educates about products/services
4. Addresses common objections
5. Includes clear calls-to-action

For each email, provide:
- Subject line
- Send delay (in hours from trigger)
- Email content (HTML and text)
- Primary goal

Format as JSON:
{
  "sequenceName": "sequence name",
  "description": "sequence description",
  "emails": [
    {
      "step": 1,
      "subject": "email subject",
      "delayHours": 0,
      "goal": "email goal",
      "html": "HTML content",
      "text": "plain text content"
    }
  ]
}
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 3000
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generating automation sequence:', error);
      throw new Error('Failed to generate automation sequence');
    }
  }

  async optimizeCampaign(campaignData, performanceData) {
    const { campaign, analytics } = campaignData;
    const { openRate, clickRate, conversionRate } = performanceData;
    
    const prompt = `
Analyze this email campaign performance and provide optimization recommendations:

Campaign Details:
- Subject: ${campaign.subject}
- Type: ${campaign.type}
- Audience: ${campaign.audience}

Performance Metrics:
- Open Rate: ${openRate}%
- Click Rate: ${clickRate}%
- Conversion Rate: ${conversionRate}%
- Sent: ${analytics.sent}
- Delivered: ${analytics.delivered}

Industry Benchmarks:
- Average Open Rate: 21.33%
- Average Click Rate: 2.62%
- Average Conversion Rate: 1.33%

Provide specific, actionable recommendations for:
1. Subject line optimization
2. Content improvements
3. Send time optimization
4. Audience segmentation
5. A/B testing suggestions

Format as JSON:
{
  "overallScore": "A-F grade",
  "recommendations": [
    {
      "category": "subject_line|content|timing|audience|testing",
      "priority": "high|medium|low",
      "recommendation": "specific recommendation",
      "expectedImpact": "expected improvement"
    }
  ],
  "nextSteps": ["action 1", "action 2", "action 3"]
}
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.6,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error optimizing campaign:', error);
      throw new Error('Failed to optimize campaign');
    }
  }

  async generateLeadMagnet(leadMagnetData) {
    const { businessInfo, topic, format, targetAudience } = leadMagnetData;

    const prompt = `
Create a compelling lead magnet for ${businessInfo.company || 'our company'}:

Business Context:
- Company: ${businessInfo.company || 'Our Company'}
- Industry: ${businessInfo.industry || 'General'}
- Target Audience: ${targetAudience || 'potential customers'}

Lead Magnet Details:
- Topic: ${topic}
- Format: ${format || 'PDF guide'}
- Goal: Capture leads and provide value

Create:
1. Compelling title and subtitle
2. Outline with key sections
3. Landing page copy
4. Email opt-in form copy
5. Follow-up email sequence (3 emails)

Format as JSON:
{
  "title": "lead magnet title",
  "subtitle": "compelling subtitle",
  "outline": ["section 1", "section 2", "section 3"],
  "landingPageCopy": {
    "headline": "main headline",
    "subheadline": "supporting text",
    "benefits": ["benefit 1", "benefit 2", "benefit 3"],
    "cta": "call to action text"
  },
  "optinForm": {
    "headline": "form headline",
    "description": "form description",
    "buttonText": "button text"
  },
  "followUpSequence": [
    {
      "subject": "email subject",
      "content": "email content"
    }
  ]
}
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generating lead magnet:', error);
      throw new Error('Failed to generate lead magnet');
    }
  }

  parseJSONResponse(response) {
    try {
      // Clean the response first
      let cleanResponse = response.trim();

      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Try to extract JSON from the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];

        // Clean up common JSON issues
        jsonStr = jsonStr
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/\n/g, '\\n') // Escape newlines
          .replace(/\r/g, '\\r') // Escape carriage returns
          .replace(/\t/g, '\\t'); // Escape tabs

        return JSON.parse(jsonStr);
      }

      // If no JSON found, create a fallback response
      return {
        subject: 'AI-Generated Campaign',
        html: `<h1>AI-Generated Content</h1><p>${response}</p>`,
        text: response,
        cta: ['Learn More', 'Get Started', 'Contact Us']
      };
    } catch (error) {
      console.error('Error parsing JSON response:', error);

      // Return a fallback response
      return {
        subject: 'AI-Generated Campaign',
        html: `<h1>AI-Generated Content</h1><p>${response}</p>`,
        text: response,
        cta: ['Learn More', 'Get Started', 'Contact Us']
      };
    }
  }
}

module.exports = new MarketingAIService();
