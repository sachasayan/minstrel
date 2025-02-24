import { GoogleGenerativeAI } from '@google/generative-ai'
import { store } from '@/lib/store/store'

const geminiService = {
  apiKey: null as string | null,
  genAI: null as GoogleGenerativeAI | null,
  model: null as any | null,

  async getApiKey() {
    const apiKey = store.getState().settings.apiKey
    if (!apiKey) {
      console.warn('API key is not defined in settings.')
      return null
    }
    return apiKey
  },

  updateApiKey(apiKey: string | null) {
    this.apiKey = apiKey
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    } else {
      this.genAI = null
      this.model = null
    }
  },

  getModel() {
    return this.model
  },

  async verifyKey(apiKey: string) {
    try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = await genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const response = await model.generateContent('Hey there!')
    console.log("API Key is valid. Available models:", response);
  } catch (error) {
    console.error("Invalid API Key or request failed:", error);
    return false;
  }
  return true;
  },

  async generateContent(prompt: string) {
    if (!this.model) {
      throw new Error('Gemini model is not initialized. Please set the API key in settings.')
    }
    const result = await this.model.generateContent([prompt])
    return result.response.text()
  }
}

export default geminiService
