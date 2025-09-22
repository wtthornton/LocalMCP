// Test template enhancer directly
import { TemplateBasedEnhancer } from './dist/tools/template-based-enhance.tool.js';

// Mock logger
const mockLogger = {
  debug: (msg, data) => console.log('DEBUG:', msg, data),
  warn: (msg, data) => console.log('WARN:', msg, data),
  info: (msg, data) => console.log('INFO:', msg, data)
};

async function testTemplateEnhancer() {
  console.log('🧪 Testing Template Enhancer...');
  
  const enhancer = new TemplateBasedEnhancer(mockLogger);
  
  // Test 1: HTML button
  console.log('\n📝 Test 1: HTML Button');
  const htmlSnippets = await enhancer.getTemplateBasedSnippets('html', 'simple', 'How do I create a button?');
  console.log('HTML Snippets:', htmlSnippets);
  
  // Test 2: React component
  console.log('\n📝 Test 2: React Component');
  const reactSnippets = await enhancer.getTemplateBasedSnippets('react', 'medium', 'Create a React component');
  console.log('React Snippets:', reactSnippets);
  
  // Test 3: Quality-based selection
  console.log('\n📝 Test 3: Quality-based Selection');
  const qualitySnippets = enhancer.selectTemplateByQuality('How do I create a button?', 'html');
  console.log('Quality Snippets:', qualitySnippets);
}

testTemplateEnhancer().catch(console.error);
