const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ChatbotService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.CHATBOT_API_KEY);
    this.conversationHistory = new Map(); // Store conversation history by session
  }

  // Initialize chatbot with business context
  async initializeChatbot(businessInfo) {
    const systemPrompt = `
      You are an AI customer service assistant for ${businessInfo.name}, a business in the ${businessInfo.industry} industry.
      
      Business Information:
      - Name: ${businessInfo.name}
      - Industry: ${businessInfo.industry}
      - Description: ${businessInfo.description}
      - Services: ${businessInfo.keyServices?.join(', ')}
      - Contact: ${businessInfo.contactInfo?.email || 'Not provided'}
      
      Your role:
      1. Answer customer questions about the business
      2. Provide information about services and products
      3. Help with general inquiries
      4. Be friendly, professional, and helpful
      5. If you don't know something, politely say so and offer to connect them with a human
      
      Always maintain a professional tone and stay focused on helping customers with their needs.
    `;

    return systemPrompt;
  }

  // Process chatbot message
  async processMessage(sessionId, message, businessInfo) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Get or create conversation history
      if (!this.conversationHistory.has(sessionId)) {
        const systemPrompt = await this.initializeChatbot(businessInfo);
        this.conversationHistory.set(sessionId, [
          { role: 'system', content: systemPrompt }
        ]);
      }

      const history = this.conversationHistory.get(sessionId);
      
      // Add user message to history
      history.push({ role: 'user', content: message });

      // Create conversation context
      const conversationContext = history
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      const prompt = `
        ${conversationContext}
        
        assistant: Please respond to the user's message as a helpful customer service representative for ${businessInfo.name}. 
        Keep your response concise, friendly, and focused on helping the customer.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const botResponse = response.text();

      // Add bot response to history
      history.push({ role: 'assistant', content: botResponse });

      // Limit history to last 20 messages to prevent token overflow
      if (history.length > 20) {
        history.splice(1, 2); // Remove oldest user-assistant pair, keep system prompt
      }

      return {
        response: botResponse,
        sessionId,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Chatbot processing error:', error);
      return {
        response: "I apologize, but I'm experiencing technical difficulties. Please try again or contact our support team directly.",
        sessionId,
        timestamp: new Date(),
        error: true
      };
    }
  }

  // Get conversation history
  getConversationHistory(sessionId) {
    return this.conversationHistory.get(sessionId) || [];
  }

  // Clear conversation history
  clearConversationHistory(sessionId) {
    this.conversationHistory.delete(sessionId);
  }

  // Generate FAQ responses
  async generateFAQ(businessInfo) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
        Generate a comprehensive FAQ section for ${businessInfo.name}, a business in the ${businessInfo.industry} industry.
        
        Business Details:
        - Description: ${businessInfo.description}
        - Services: ${businessInfo.keyServices?.join(', ')}
        - Target Audience: ${businessInfo.targetAudience}
        
        Create 10-15 frequently asked questions and answers that customers would typically ask about this business.
        Include questions about:
        1. Services offered
        2. Pricing and payment
        3. Business hours and contact
        4. Process and procedures
        5. Policies and guarantees
        
        Return as JSON array with objects containing 'question' and 'answer' fields.
        Make answers helpful, detailed, and professional.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating FAQ:', error);
      throw new Error('Failed to generate FAQ');
    }
  }

  // Analyze chat interactions for insights
  async analyzeChatInteractions(interactions) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
        Analyze the following customer chat interactions to provide business insights:
        
        Interactions:
        ${interactions.map((interaction, index) => 
          `${index + 1}. Customer: ${interaction.userMessage}\n   Bot: ${interaction.botResponse}`
        ).join('\n\n')}
        
        Provide analysis in JSON format with:
        1. Common customer questions and topics
        2. Customer satisfaction indicators
        3. Areas where the chatbot performed well
        4. Areas needing improvement
        5. Suggestions for FAQ updates
        6. Business insights from customer inquiries
        
        Focus on actionable insights that can improve customer service and business operations.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error analyzing chat interactions:', error);
      throw new Error('Failed to analyze chat interactions');
    }
  }

  // Generate chatbot training data
  async generateTrainingData(businessInfo, existingFAQ = []) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
        Generate training data for a customer service chatbot for ${businessInfo.name}.
        
        Business Information:
        - Industry: ${businessInfo.industry}
        - Description: ${businessInfo.description}
        - Services: ${businessInfo.keyServices?.join(', ')}
        
        Create 20-30 example customer queries and appropriate responses that cover:
        1. Service inquiries
        2. Pricing questions
        3. Booking/scheduling
        4. General information
        5. Complaint handling
        6. Technical support (if applicable)
        
        Return as JSON array with objects containing 'userQuery' and 'expectedResponse' fields.
        Make the queries realistic and varied in phrasing.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating training data:', error);
      throw new Error('Failed to generate training data');
    }
  }
}

module.exports = new ChatbotService();
