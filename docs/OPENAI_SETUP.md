# OpenAI Setup Guide for PromptMCP

## Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Run the setup script - this creates both .env and centralized config
npm run setup:openai
```

### Option 2: Manual Setup

1. **Create centralized keys file:**
   ```bash
   # Create config/openai-keys.env with your credentials
   cp config/env.example config/openai-keys.env
   ```

2. **Edit the centralized keys file:**
   ```bash
   # OpenAI Integration - Centralized Configuration
   OPENAI_API_KEY=your_actual_openai_api_key_here
   OPENAI_PROJECT_ID=your_actual_openai_project_id_here
   OPENAI_MODEL=gpt-4
   OPENAI_MAX_TOKENS=4000
   OPENAI_TEMPERATURE=0.3
   OPENAI_TIMEOUT=60000
   OPENAI_RETRIES=3
   ```

3. **Create production .env file:**
   ```bash
   cp config/env.example .env
   # Edit .env with your production credentials
   ```

## Getting Your OpenAI Credentials

### 1. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in to your account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated key (starts with `sk-`)

### 2. OpenAI Project ID (Optional but Recommended)
1. In the OpenAI Platform, go to "Projects"
2. Create a new project or select an existing one
3. Copy the Project ID (starts with `proj_`)

## Configuration Options

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required | `sk-proj-...` |
| `OPENAI_PROJECT_ID` | Your OpenAI project ID | Optional | `proj_...` |
| `OPENAI_MODEL` | Model to use | `gpt-4` | `gpt-4`, `gpt-3.5-turbo` |
| `OPENAI_MAX_TOKENS` | Maximum tokens per request | `4000` | `2000`, `4000`, `8000` |
| `OPENAI_TEMPERATURE` | Response creativity (0-2) | `0.3` | `0.1`, `0.7`, `1.0` |
| `OPENAI_TIMEOUT` | Request timeout in ms | `60000` | `30000`, `120000` |
| `OPENAI_RETRIES` | Number of retry attempts | `3` | `1`, `5` |

## Security Best Practices

### ✅ Do:
- Keep your API key secure and never commit it to version control
- Use environment variables or `.env` files
- Regularly rotate your API keys
- Monitor your API usage and costs

### ❌ Don't:
- Hardcode API keys in source code
- Share API keys in public repositories
- Use production keys in development

## Docker Setup

If using Docker, your environment variables will be automatically loaded from the `.env` file:

```bash
# Start with Docker
docker-compose up

# Or build and run
docker-compose up --build
```

## Verification

After setup, you can verify your configuration:

```bash
# Test the configuration
npm run test:openai

# Or check the logs when starting the server
npm start
```

## Troubleshooting

### Common Issues:

1. **"OpenAI API key not set"**
   - Ensure your `.env` file exists and contains `OPENAI_API_KEY`
   - Check that the key starts with `sk-`

2. **"Invalid API key"**
   - Verify your API key is correct
   - Check if your OpenAI account has sufficient credits
   - Ensure the key hasn't expired

3. **"Project ID not found"**
   - Verify your project ID is correct
   - Check that the project exists in your OpenAI account
   - Project ID is optional, you can comment out this line

4. **Rate limiting errors**
   - Reduce `OPENAI_MAX_TOKENS` or increase `OPENAI_RETRIES`
   - Check your OpenAI usage limits

### Getting Help:

- Check the logs: `tail -f logs/promptmcp.log`
- Test API connectivity: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`
- Review OpenAI documentation: [OpenAI API Docs](https://platform.openai.com/docs)

## Next Steps

Once OpenAI is configured, you can:

1. **Test the integration:**
   ```bash
   npm run test:breakdown
   ```

2. **Start using AI-powered features:**
   - Task breakdown with `promptmcp.breakdown`
   - Enhanced context with AI analysis
   - Intelligent prompt optimization

3. **Monitor usage:**
   - Check OpenAI dashboard for usage statistics
   - Monitor PromptMCP logs for API calls
   - Set up usage alerts if needed
