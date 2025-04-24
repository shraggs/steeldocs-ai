import axios from 'axios';

const callAI = async (pdfUrl, userPrompt) => {
  try {
    const response = await axios.post('https://steeldocs-ai.onrender.com/analyze', {
      pdfUrl,
      prompt: userPrompt,
    });

    if (response.data && response.data.result) {
      return response.data.result;
    } else {
      console.error('Unexpected response structure:', response);
      return 'An error occurred: Unexpected response format.';
    }
  } catch (error) {
    console.error('Error calling AI:', error);
    return 'An error occurred while processing your prompt.';
  }
};

export default callAI;
