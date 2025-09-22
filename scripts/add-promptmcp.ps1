# Add PromptMCP to Cursor settings
$settingsPath = "C:\Users\tappt\AppData\Roaming\Cursor\User\settings.json"

# Read current settings
$settings = Get-Content $settingsPath | ConvertFrom-Json

# Add promptmcp server
$settings.'mcp.servers'.'promptmcp' = @{
    command = 'docker'
    args = @('run', '--rm', '-i', 'promptmcp-mcp')
    env = @{}
    stdio = $true
    description = 'PromptMCP - Enhanced prompt generation with project context'
}

# Write back to file
$settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $settingsPath -Encoding UTF8

Write-Host "✅ Successfully added promptmcp to Cursor settings"
Write-Host "📄 Settings file: $settingsPath"
Write-Host "🔄 Please restart Cursor to see the new MCP server"
