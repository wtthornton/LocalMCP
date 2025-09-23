const { OpenAIService } = require('./dist/services/ai/openai.service.js');
const { Logger } = require('./dist/services/logger/logger.js');

async function testOpenAI() {
  try {
    console.log('=== OPENAI INTEGRATION TEST ===');
    console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY environment variable is not set');
      console.log('To test with your real key, run:');
      console.log('$env:OPENAI_API_KEY = "sk-your-real-key-here"');
      console.log('Then run this test again');
      process.exit(1);
    }

    if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.log('✅ OpenAI API key format looks correct');
    } else {
      console.log('⚠️  OpenAI API key format may be incorrect (should start with sk-)');
    }

    console.log('\n=== TESTING OPENAI SERVICE ===');

    const logger = new Logger();
    const openaiService = new OpenAIService(logger, {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.2
    });
    
    console.log('Testing OpenAI connection...');
    const connectionTest = await openaiService.testConnection();
    console.log('OpenAI connection test:', connectionTest ? 'SUCCESS' : 'FAILED');
    
    if (!connectionTest) {
      console.log('❌ OpenAI integration is NOT working - connection test failed');
      return;
    }
    
    console.log('\nTesting OpenAI code snippets generation...');
    const response = await openaiService.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a senior software engineer specializing in HTML development. Generate 3-5 practical, production-ready code snippets for HTML development. Return ONLY the code snippets, one per line, without explanations.'
        },
        {
          role: 'user',
          content: 'Generate 3-5 practical HTML code snippets for creating a modern hello world page'
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });
    
    const content = response.choices[0]?.message?.content;
    console.log('OpenAI response length:', content ? content.length : 0);
    
    if (content) {
      const snippets = content.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
      console.log('\nGenerated code snippets:');
      snippets.forEach((snippet, i) => {
        console.log((i + 1) + '. ' + snippet);
      });
      console.log('\n✅ OpenAI integration is working! Code snippets are being generated.');
    } else {
      console.log('❌ No content received from OpenAI');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('401')) {
      console.error('❌ Invalid OpenAI API key - please check your key');
    } else if (error.message.includes('429')) {
      console.error('❌ Rate limit exceeded - please try again later');
    } else {
      console.error('❌ OpenAI error:', error.message);
    }
  }
}

testOpenAI();
