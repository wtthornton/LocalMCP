import { spawn } from 'child_process';

console.log('🧪 Testing environment variables in Docker container...\n');

const mcpRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'promptmcp.health',
    arguments: {}
  }
};

const mcpProcess = spawn('docker', [
  'exec', '-i', 'promptmcp-server',
  'sh', '-c', 'ENHANCE_DEBUG=true CONTEXT7_DEBUG=true NODE_ENV=production CONTEXT7_API_KEY=${CONTEXT7_API_KEY:-test-key} CONTEXT7_ENABLED=true CONTEXT7_USE_HTTP_ONLY=true CONTEXT7_CHECK_COMPATIBILITY=false OPENAI_API_KEY=${OPENAI_API_KEY:-test-key} OPENAI_PROJECT_ID=${OPENAI_PROJECT_ID:-test-project} OPENAI_MODEL=gpt-4 OPENAI_MAX_TOKENS=4000 OPENAI_TEMPERATURE=0.3 LOG_LEVEL=debug WORKSPACE_PATH=/app QDRANT_URL=http://qdrant:6333 QDRANT_API_KEY= QDRANT_COLLECTION_NAME=promptmcp_vectors node dist/mcp/server.js'
], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';
let errorData = '';

mcpProcess.stdout.on('data', (data) => {
  responseData += data.toString();
});

mcpProcess.stderr.on('data', (data) => {
  errorData += data.toString();
});

mcpProcess.on('close', (code) => {
  console.log('📤 Request sent:', JSON.stringify(mcpRequest, null, 2));
  console.log('\n📥 Response received:');
  console.log(responseData);
  
  if (errorData) {
    console.log('\n❌ Errors:');
    console.log(errorData);
  }
  
  console.log(`\n🔚 Process exited with code: ${code}`);
});

// Send the request
mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcpProcess.stdin.end();