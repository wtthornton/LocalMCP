/**
 * Multi-Project Admin Interface
 * 
 * Extends the admin console with multi-project management capabilities.
 * Provides project switching, status monitoring, and project-specific analytics.
 * 
 * Vibe Coder Benefits:
 * - Visual project management interface
 * - Easy project switching and monitoring
 * - Project-specific insights and analytics
 * - Centralized project administration
 */

import { Logger } from '../services/logger/logger.js';
import { ProjectManagerService, type ProjectStatus } from '../services/project/project-manager.service.js';
import { ProjectStorageService, type ProjectStorageContext } from '../services/project/project-storage.service.js';

const logger = new Logger('MultiProjectAdmin');

export interface MultiProjectAdminConfig {
  enableProjectSwitching: boolean;
  enableProjectAnalytics: boolean;
  enableProjectHealthMonitoring: boolean;
  maxProjectsPerPage: number;
  refreshInterval: number;
}

export class MultiProjectAdmin {
  private projectManager: ProjectManagerService;
  private projectStorage: ProjectStorageService;
  private config: MultiProjectAdminConfig;
  private refreshTimer?: NodeJS.Timeout;

  constructor(
    projectManager: ProjectManagerService,
    projectStorage: ProjectStorageService,
    config?: Partial<MultiProjectAdminConfig>
  ) {
    this.projectManager = projectManager;
    this.projectStorage = projectStorage;
    this.config = {
      enableProjectSwitching: true,
      enableProjectAnalytics: true,
      enableProjectHealthMonitoring: true,
      maxProjectsPerPage: 20,
      refreshInterval: 30000, // 30 seconds
      ...config
    };

    logger.info('MultiProjectAdmin initialized', { config: this.config });

    if (this.config.enableProjectHealthMonitoring) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Generate multi-project dashboard HTML
   */
  generateMultiProjectDashboard(): string {
    const projects = this.projectManager.getProjects();
    const projectStatuses = this.projectManager.getAllProjectStatuses();
    const currentProject = this.projectManager.getCurrentProject();
    const statistics = this.projectManager.getProjectStatistics();
    const storageStats = this.projectStorage.getGlobalStorageStats();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalMCP - Multi-Project Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0d1117;
            color: #e6edf3;
            line-height: 1.6;
        }
        
        .header {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            color: #58a6ff;
            font-size: 24px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .stat-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-card h3 {
            color: #58a6ff;
            margin-bottom: 10px;
        }
        
        .stat-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #f0f6fc;
        }
        
        .stat-card .label {
            color: #8b949e;
            font-size: 14px;
            margin-top: 5px;
        }
        
        .current-project {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            margin: 20px;
        }
        
        .current-project h2 {
            color: #58a6ff;
            margin-bottom: 15px;
        }
        
        .project-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            color: #8b949e;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #f0f6fc;
            font-weight: 500;
        }
        
        .projects-section {
            padding: 20px;
        }
        
        .projects-section h2 {
            color: #58a6ff;
            margin-bottom: 20px;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .project-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            transition: border-color 0.2s;
        }
        
        .project-card:hover {
            border-color: #58a6ff;
        }
        
        .project-card.active {
            border-color: #238636;
            background: #0d1117;
        }
        
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .project-name {
            color: #f0f6fc;
            font-size: 18px;
            font-weight: 600;
        }
        
        .project-status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-healthy {
            background: #238636;
            color: white;
        }
        
        .status-error {
            background: #f85149;
            color: white;
        }
        
        .status-warning {
            background: #fb8500;
            color: white;
        }
        
        .project-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        
        .detail-label {
            color: #8b949e;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        
        .detail-value {
            color: #e6edf3;
            font-size: 14px;
        }
        
        .project-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #238636;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2ea043;
        }
        
        .btn-secondary {
            background: #21262d;
            color: #f0f6fc;
            border: 1px solid #30363d;
        }
        
        .btn-secondary:hover {
            background: #30363d;
        }
        
        .refresh-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 10px;
            font-size: 12px;
            color: #8b949e;
        }
        
        .error-message {
            background: #f85149;
            color: white;
            padding: 15px;
            border-radius: 6px;
            margin: 20px;
        }
        
        .warning-message {
            background: #fb8500;
            color: white;
            padding: 15px;
            border-radius: 6px;
            margin: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LocalMCP Multi-Project Dashboard</h1>
        <div class="refresh-indicator" id="refreshIndicator">
            Last updated: ${new Date().toLocaleTimeString()}
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Projects</h3>
            <div class="value">${statistics.totalProjects}</div>
            <div class="label">Managed Projects</div>
        </div>
        <div class="stat-card">
            <h3>Healthy Projects</h3>
            <div class="value">${statistics.healthyProjects}</div>
            <div class="label">${statistics.totalProjects > 0 ? Math.round((statistics.healthyProjects / statistics.totalProjects) * 100) : 0}% Health Rate</div>
        </div>
        <div class="stat-card">
            <h3>Total Lessons</h3>
            <div class="value">${storageStats.totalLessons}</div>
            <div class="label">Across All Projects</div>
        </div>
        <div class="stat-card">
            <h3>Storage Size</h3>
            <div class="value">${(storageStats.totalStorageSize / 1024 / 1024).toFixed(1)}MB</div>
            <div class="label">Total Storage Used</div>
        </div>
    </div>

    ${currentProject ? `
    <div class="current-project">
        <h2>Current Active Project</h2>
        <div class="project-info">
            <div class="info-item">
                <div class="info-label">Project Name</div>
                <div class="info-value">${currentProject.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Project ID</div>
                <div class="info-value">${currentProject.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Root Path</div>
                <div class="info-value">${currentProject.rootPath}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tech Stack</div>
                <div class="info-value">${currentProject.techStack.languages.join(', ')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Accessed</div>
                <div class="info-value">${currentProject.lastAccessed.toLocaleString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Git Branch</div>
                <div class="info-value">${currentProject.gitInfo.gitBranch || 'No branch'}</div>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="projects-section">
        <h2>All Projects (${projects.length})</h2>
        <div class="projects-grid">
            ${projects.map(project => {
              const status = projectStatuses.find(s => s.id === project.id);
              const isActive = currentProject?.id === project.id;
              const statusClass = status?.isHealthy ? 'status-healthy' : 
                                 status?.errors.length > 0 ? 'status-error' : 'status-warning';
              
              return `
                <div class="project-card ${isActive ? 'active' : ''}">
                    <div class="project-header">
                        <div class="project-name">${project.name}</div>
                        <div class="project-status ${statusClass}">
                            ${status?.isHealthy ? 'Healthy' : 'Issues'}
                        </div>
                    </div>
                    <div class="project-details">
                        <div class="detail-item">
                            <div class="detail-label">Type</div>
                            <div class="detail-value">${project.projectStructure.type}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Complexity</div>
                            <div class="detail-value">${project.techStack.metadata.complexity}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Languages</div>
                            <div class="detail-value">${project.techStack.languages.join(', ')}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Last Accessed</div>
                            <div class="detail-value">${project.lastAccessed.toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="project-actions">
                        ${!isActive ? `<button class="btn btn-primary" onclick="switchProject('${project.id}')">Switch To</button>` : '<div class="btn btn-primary" style="opacity: 0.5;">Active</div>'}
                        <button class="btn btn-secondary" onclick="refreshProject('${project.id}')">Refresh</button>
                    </div>
                </div>
              `;
            }).join('')}
        </div>
    </div>

    <script>
        let refreshInterval;
        
        function switchProject(projectId) {
            fetch('/api/projects/switch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ projectId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Failed to switch project: ' + data.errors.join(', '));
                }
            })
            .catch(error => {
                alert('Error switching project: ' + error.message);
            });
        }
        
        function refreshProject(projectId) {
            fetch(\`/api/projects/\${projectId}/refresh\`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Failed to refresh project: ' + data.errors.join(', '));
                }
            })
            .catch(error => {
                alert('Error refreshing project: ' + error.message);
            });
        }
        
        function startAutoRefresh() {
            refreshInterval = setInterval(() => {
                location.reload();
            }, ${this.config.refreshInterval});
        }
        
        function updateRefreshIndicator() {
            const indicator = document.getElementById('refreshIndicator');
            if (indicator) {
                indicator.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
            }
        }
        
        // Start auto-refresh
        startAutoRefresh();
        
        // Update refresh indicator every second
        setInterval(updateRefreshIndicator, 1000);
    </script>
</body>
</html>
    `;
  }

  /**
   * Handle API requests for multi-project management
   */
  handleApiRequest(path: string, method: string, body?: any): Promise<any> {
    logger.debug(`Handling API request: ${method} ${path}`);

    switch (path) {
      case '/api/projects':
        if (method === 'GET') {
          return this.handleGetProjects();
        }
        break;

      case '/api/projects/switch':
        if (method === 'POST') {
          return this.handleSwitchProject(body);
        }
        break;

      case '/api/projects/refresh':
        if (method === 'POST') {
          return this.handleRefreshProjects();
        }
        break;

      case '/api/projects/stats':
        if (method === 'GET') {
          return this.handleGetProjectStats();
        }
        break;

      default:
        // Handle dynamic project-specific routes
        if (path.startsWith('/api/projects/') && path.endsWith('/refresh')) {
          const projectId = path.split('/')[3];
          return this.handleRefreshProject(projectId);
        }
        break;
    }

    return Promise.resolve({ error: 'Not found' });
  }

  /**
   * Get all projects
   */
  private async handleGetProjects(): Promise<any> {
    const projects = this.projectManager.getProjects();
    const statuses = this.projectManager.getAllProjectStatuses();
    
    return {
      projects: projects.map(project => ({
        ...project,
        status: statuses.find(s => s.id === project.id)
      }))
    };
  }

  /**
   * Switch to a different project
   */
  private async handleSwitchProject(body: any): Promise<any> {
    const { projectId } = body;
    
    if (!projectId) {
      return {
        success: false,
        errors: ['Project ID is required']
      };
    }

    try {
      const result = await this.projectManager.switchProject(projectId);
      return result;
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Refresh all projects
   */
  private async handleRefreshProjects(): Promise<any> {
    try {
      const projects = this.projectManager.getProjects();
      const results = [];

      for (const project of projects) {
        try {
          const refreshed = await this.projectManager.refreshProject(project.id);
          results.push({
            projectId: project.id,
            success: !!refreshed,
            name: project.name
          });
        } catch (error) {
          results.push({
            projectId: project.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            name: project.name
          });
        }
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Refresh a specific project
   */
  private async handleRefreshProject(projectId: string): Promise<any> {
    try {
      const refreshed = await this.projectManager.refreshProject(projectId);
      return {
        success: !!refreshed,
        project: refreshed
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get project statistics
   */
  private async handleGetProjectStats(): Promise<any> {
    const projectStats = this.projectManager.getProjectStatistics();
    const storageStats = this.projectStorage.getGlobalStorageStats();
    
    return {
      projects: projectStats,
      storage: storageStats
    };
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.refreshTimer = setInterval(() => {
      this.updateProjectHealth().catch(error => {
        logger.error('Health monitoring failed:', error instanceof Error ? error.message : 'Unknown error');
      });
    }, this.config.refreshInterval);
  }

  /**
   * Update project health status
   */
  private async updateProjectHealth(): Promise<void> {
    const projects = this.projectManager.getProjects();
    
    for (const project of projects) {
      try {
        await this.projectManager.refreshProject(project.id);
      } catch (error) {
        logger.warn(`Health check failed for project ${project.name}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthMonitoring();
    logger.info('MultiProjectAdmin destroyed');
  }
}
