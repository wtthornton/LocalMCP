/**
 * AI Summarization Example
 * 
 * Simple example showing how to use the AI summarization feature
 * to reduce token usage in PromptMCP cache.
 */

const { EnhancedContext7EnhanceToolWithSummarization } = require('../dist/tools/enhanced-context7-enhance-with-summarization.tool.js');

async function demonstrateSummarization() {
  console.log('🚀 PromptMCP AI Summarization Demo\n');

  // Initialize the enhanced tool with summarization
  const config = {
    context7: {
      apiKey: process.env.CONTEXT7_API_KEY,
      baseUrl: process.env.CONTEXT7_BASE_URL || 'https://api.context7.io'
    },
    frameworkDetection: {
      enabled: true,
      confidenceThreshold: 0.7
    },
    cache: {
      dbPath: './prompt-cache.db',
      enabled: true
    },
    summarization: {
      enabled: true,
      minTokensToSummarize: 500
    }
  };

  const enhanceTool = new EnhancedContext7EnhanceToolWithSummarization(
    config,
    process.env.OPENAI_API_KEY
  );

  // Example 1: Simple prompt (won't trigger summarization)
  console.log('📝 Example 1: Simple prompt');
  const simpleRequest = {
    prompt: "Create a button component",
    options: {
      useSummarization: true,
      useCache: true
    }
  };

  try {
    const simpleResponse = await enhanceTool.enhance(simpleRequest);
    console.log('✅ Enhanced prompt:', simpleResponse.enhanced_prompt);
    console.log('📊 Summarization info:', simpleResponse.summarization);
    console.log('🎯 Frameworks detected:', simpleResponse.frameworks_detected);
    console.log('');
  } catch (error) {
    console.error('❌ Simple request failed:', error.message);
  }

  // Example 2: Complex prompt (will trigger summarization)
  console.log('📝 Example 2: Complex prompt with large context');
  const complexRequest = {
    prompt: "Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL",
    context: {
      projectContext: {
        repoFacts: [
          "Project name: my-awesome-app",
          "Project description: A modern full-stack application with advanced features",
          "Uses Next.js framework (^14.0.0)",
          "Uses TypeScript framework (^5.0.0)",
          "Uses PostgreSQL database (^15.0.0)",
          "Uses Prisma ORM (^5.0.0)",
          "Uses Tailwind CSS (^3.0.0)",
          "Uses NextAuth.js for authentication (^4.0.0)",
          "Uses Socket.io for real-time features (^4.0.0)",
          "Uses AWS S3 for file storage (^3.0.0)",
          "Uses Vercel for deployment (^1.0.0)",
          "Has comprehensive testing setup with Jest and Cypress",
          "Uses ESLint and Prettier for code quality",
          "Implements CI/CD with GitHub Actions",
          "Uses Docker for containerization",
          "Has comprehensive error handling and logging",
          "Uses Redis for caching and session storage",
          "Implements rate limiting and security measures",
          "Uses Stripe for payment processing",
          "Has comprehensive API documentation with Swagger"
        ],
        codeSnippets: [
          "// User authentication with NextAuth.js\nconst authOptions = {\n  providers: [\n    CredentialsProvider({\n      credentials: {\n        email: { label: 'Email', type: 'email' },\n        password: { label: 'Password', type: 'password' }\n      },\n      async authorize(credentials) {\n        // Authentication logic\n      }\n    })\n  ],\n  callbacks: {\n    async jwt({ token, user }) {\n      return { ...token, ...user };\n    },\n    async session({ session, token }) {\n      return { ...session, ...token };\n    }\n  }\n};",
          "// Real-time chat with Socket.io\nconst io = new Server(server, {\n  cors: {\n    origin: process.env.CLIENT_URL,\n    methods: ['GET', 'POST']\n  }\n});\n\nio.on('connection', (socket) => {\n  socket.on('join-room', (roomId) => {\n    socket.join(roomId);\n  });\n  \n  socket.on('send-message', (data) => {\n    socket.to(data.roomId).emit('receive-message', data);\n  });\n});",
          "// File upload with AWS S3\nconst uploadToS3 = async (file: File) => {\n  const params = {\n    Bucket: process.env.AWS_S3_BUCKET,\n    Key: `uploads/${Date.now()}-${file.name}`,\n    Body: file,\n    ContentType: file.type\n  };\n  \n  return await s3.upload(params).promise();\n};"
        ],
        context7Docs: [
          "Next.js Documentation: Next.js is a React framework that provides server-side rendering, static site generation, and API routes. Key features include automatic code splitting, optimized performance, and built-in CSS support.",
          "TypeScript Documentation: TypeScript adds static type checking to JavaScript, providing better tooling, error detection, and code documentation. It supports modern JavaScript features and can be configured with strict type checking.",
          "PostgreSQL Documentation: PostgreSQL is a powerful, open-source relational database system. It supports advanced data types, full-text search, and ACID compliance. Best practices include proper indexing, query optimization, and connection pooling."
        ]
      }
    },
    options: {
      useSummarization: true,
      useCache: true,
      useAIEnhancement: true
    }
  };

  try {
    const complexResponse = await enhanceTool.enhance(complexRequest);
    console.log('✅ Enhanced prompt:', complexResponse.enhanced_prompt);
    console.log('📊 Summarization info:', complexResponse.summarization);
    console.log('🎯 Frameworks detected:', complexResponse.frameworks_detected);
    console.log('🤖 AI Enhancement:', complexResponse.ai_enhancement?.enabled ? 'Enabled' : 'Disabled');
    console.log('');
  } catch (error) {
    console.error('❌ Complex request failed:', error.message);
  }

  // Example 3: Show cache statistics
  console.log('📊 Cache Statistics:');
  try {
    const stats = await enhanceTool.getCacheStats();
    console.log('✅ Cache stats:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error.message);
  }

  // Cleanup
  await enhanceTool.cleanup();
  console.log('\n🎉 Demo completed!');
}

// Run the demo
if (require.main === module) {
  demonstrateSummarization().catch(console.error);
}

module.exports = { demonstrateSummarization };
