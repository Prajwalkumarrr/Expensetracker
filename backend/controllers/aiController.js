import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with API key
const genAI = new GoogleGenerativeAI('AIzaSyDCalvujJX4UqKkXIXOaqWAuPGCEQ3jRpg');

// Helper function to check internet connectivity
async function checkInternetConnection() {
  try {
    await fetch('https://www.google.com');
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to detect if the message is a greeting
function isGreeting(message) {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  const isGreeting = greetings.some(greeting => message.toLowerCase().includes(greeting));
  console.log('Greeting check:', { message, isGreeting });
  return isGreeting;
}

export const chatWithAI = async (req, res) => {
  try {
    // Check internet connectivity first
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      console.error('No internet connection detected');
      return res.status(503).json({
        message: "Unable to connect to the internet. Please check your connection."
      });
    }

    console.log('Request body:', req.body);
    const { message, expenses } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        message: "Message is required" 
      });
    }

    // Prepare the prompt based on message type
    let prompt;
    if (isGreeting(message)) {
      console.log('Processing greeting message');
      prompt = `Respond to this greeting: "${message}". 
                You are a friendly financial assistant. 
                Give a short, friendly response and briefly mention that you can help with financial advice.`;
    } else if (expenses && expenses.length > 0) {
      prompt = `As a financial assistant, analyze these expenses: ${JSON.stringify(expenses)}.\n\n`;
      prompt += `User Question: ${message}\n\n`;
      prompt += `Please provide specific financial advice based on these expenses and the user's question. `;
      prompt += `Focus on practical budgeting tips, saving opportunities, and expense optimization. `;
      prompt += `Be detailed but concise.`;
    } else {
      prompt = `User Question: ${message}\n\n`;
      prompt += `As a financial assistant, please provide specific and practical advice regarding this question. `;
      prompt += `Focus on actionable financial tips and clear recommendations. `;
      prompt += `Keep your response clear, concise, and directly relevant to the question.`;
    }

    console.log('Sending prompt to Gemini:', prompt);
    
    // Get the model and generate content
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    console.log('Generating content...');
    const result = await model.generateContent(prompt);
    console.log('Content generated, getting response...');
    
    if (!result || !result.response) {
      console.error('Empty response from Gemini');
      return res.status(500).json({
        message: "Received empty response from AI service"
      });
    }

    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      console.error('Empty text in response');
      return res.status(500).json({
        message: "Received empty text from AI service"
      });
    }

    console.log('Gemini response:', text);

    res.json({ 
      message: text
    });
  } catch (error) {
    console.error('Detailed Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    // Check for specific error types
    if (error.message.includes('fetch failed')) {
      return res.status(503).json({
        message: "Network error while connecting to AI service. Please check your internet connection and try again.",
        error: error.message
      });
    }

    if (error.message.includes('API key')) {
      return res.status(401).json({
        message: "Invalid API key configuration. Please contact support.",
        error: error.message
      });
    }

    res.status(500).json({ 
      message: "An error occurred while processing your request.",
      error: error.message,
      details: error.stack
    });
  }
}; 