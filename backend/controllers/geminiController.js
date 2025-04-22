import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Google AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const chatWithAI = async (req, res) => {
  try {
    console.log('Received chat request:', {
      messageExists: !!req.body.message,
      expensesExists: !!req.body.expenses,
      messageLength: req.body.message?.length || 0
    });

    // Validate Google API key
    if (!process.env.GOOGLE_API_KEY) {
      console.error('Google API key is missing');
      return res.status(500).json({ 
        message: "Google API key is not configured. Please check your environment variables." 
      });
    }

    const { message, expenses } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        message: "Message is required" 
      });
    }

    // Prepare the prompt with expenses
    const prompt = expenses 
      ? `As a financial assistant, consider these expenses: ${expenses}. 
         ${message}
         Provide concise, actionable financial advice based on these spending patterns. 
         Focus on budgeting tips, saving opportunities, and expense optimization.`
      : `As a financial assistant, ${message}
         Provide concise, actionable financial advice. 
         Focus on budgeting tips, saving opportunities, and expense optimization.`;

    console.log('Attempting Gemini request with prompt:', prompt);
    
    try {
      // Get the model and generate content
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      console.log('Model initialized');

      const result = await model.generateContent(prompt);
      console.log('Content generated');

      const response = await result.response;
      console.log('Response received');

      const text = response.text();
      console.log('Response text:', text);

      res.json({ 
        message: text
      });
    } catch (aiError) {
      console.error('Gemini API Error:', {
        name: aiError.name,
        message: aiError.message,
        stack: aiError.stack,
        details: aiError.details || 'No additional details'
      });
      throw aiError;
    }
  } catch (error) {
    console.error('Full Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details || 'No additional details'
    });

    // Handle specific error types
    if (error.message.includes('API key')) {
      return res.status(401).json({
        message: "Invalid API key for Gemini AI. Please check the configuration.",
        error: error.message
      });
    }

    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return res.status(429).json({
        message: "Rate limit exceeded. Please try again later.",
        error: error.message
      });
    }

    if (error.message.includes('network') || error.message.includes('connection')) {
      return res.status(503).json({
        message: "Unable to connect to Gemini AI service. Please try again later.",
        error: error.message
      });
    }

    res.status(500).json({ 
      message: "An error occurred while processing your request.",
      error: error.message,
      details: error.details || error.stack
    });
  }
}; 