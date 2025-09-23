/**
 * Debug test for task context integration
 */

import { TodoService } from './dist/services/todo/todo.service.js';
import { Logger } from './dist/services/logger/logger.js';

async function testTaskContextDebug() {
  console.log('🧪 Debug Task Context Integration...\n');

  try {
    // Initialize services
    const logger = new Logger('Test-TaskContext');
    const todoService = new TodoService('todos.db');
    
    // Create a test todo
    console.log('📝 Creating test todo...');
    await todoService.createTodo({
      projectId: 'test-project',
      title: 'Create a React login component with TypeScript',
      description: 'Build a reusable login form component',
      priority: 'high',
      category: 'feature'
    });
    
    console.log('✅ Test todo created\n');

    // Test the getActiveTasks logic directly
    console.log('🔍 Testing getActiveTasks logic...');
    
    // Get pending tasks
    const pendingTasks = await todoService.listTodos('test-project', {
      status: 'pending'
    });
    
    console.log('Pending tasks:', pendingTasks);
    
    // Get in-progress tasks
    const inProgressTasks = await todoService.listTodos('test-project', {
      status: 'in_progress'
    });
    
    console.log('In-progress tasks:', inProgressTasks);
    
    // Combine both lists
    const allTasks = [
      ...(Array.isArray(pendingTasks) ? pendingTasks : []),
      ...(Array.isArray(inProgressTasks) ? inProgressTasks : [])
    ];
    
    console.log('Combined tasks:', allTasks);
    
    if (allTasks.length > 0) {
      const taskTitles = allTasks.map(task => `- ${task.title}`);
      console.log('Task titles:', taskTitles);
      
      const taskContext = `\n\n## Current Project Tasks:\n${taskTitles.join('\n')}`;
      console.log('Task context to add:', taskContext);
    }

    console.log('\n✅ Task context debug completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testTaskContextDebug();
