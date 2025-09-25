const Database = require('better-sqlite3');

const db = new Database('prompt-cache.db');

// Get a sample entry
const entry = db.prepare('SELECT context, framework_detection, original_prompt FROM prompt_cache LIMIT 1').get();

console.log('Sample cache entry:');
console.log('Original prompt:', entry?.original_prompt);
console.log('Stored context:', entry?.context);
console.log('Stored framework:', entry?.framework_detection);

// Test key generation
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

const generateKey = (prompt, context, framework) => {
  const promptHash = hashString(prompt.toLowerCase().trim());
  const contextHash = hashString(JSON.stringify(context, Object.keys(context).sort()));
  const frameworkHash = hashString(JSON.stringify(framework?.detectedFrameworks || [], Object.keys(framework || {}).sort()));
  return `prompt:${promptHash}:${contextHash}:${frameworkHash}`;
};

// Test with benchmark data
const testPrompt = 'What is 2+2?';
const testContext = {}; // Benchmark uses empty context
const testFramework = { detectedFrameworks: ['react'] };

const benchmarkKey = generateKey(testPrompt, testContext, testFramework);
console.log('\nBenchmark key:', benchmarkKey);

// Test with stored data
const storedContext = entry?.context ? JSON.parse(entry.context) : {};
const storedFramework = entry?.framework_detection ? JSON.parse(entry.framework_detection) : {};

const storedKey = generateKey(entry?.original_prompt || '', storedContext, storedFramework);
console.log('Stored key:', storedKey);

console.log('Keys match:', benchmarkKey === storedKey);

db.close();
