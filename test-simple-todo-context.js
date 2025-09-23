/**
 * Simple test for todo context integration
 * Tests just the task context functionality
 */

import { TodoService } from './dist/services/todo/todo.service.js';
import { Logger } from './dist/services/logger/logger.js';

async function testSimpleTodoContext() {
  console.log('🧪 Testing Simple Todo Context...\n');

  try {
    // Initialize services
    const logger = new Logger('Test-SimpleTodo');
    const todoService = new TodoService('test-simple-todos.db');
    
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

    // Test getting all tasks first
    console.log('🔍 Testing listTodos...');
    const allTasks = await todoService.listTodos('test-project', {});
    
    console.log('📋 All tasks found:', allTasks.data?.length || 0);
    if (allTasks.data && allTasks.data.length > 0) {
      console.log('Tasks:');
      allTasks.data.forEach(task => {
        console.log(`  - ${task.title} (${task.status})`);
      });
    }

    // Test getting active tasks
    console.log('\n🔍 Testing getActiveTasks...');
    const activeTasks = await todoService.listTodos('test-project', {
      status: 'pending'
    });
    
    console.log('📋 Active tasks found:', activeTasks.data?.length || 0);
    if (activeTasks.data && activeTasks.data.length > 0) {
      console.log('Active Tasks:');
      activeTasks.data.forEach(task => {
        console.log(`  - ${task.title}`);
      });
    }

    console.log('\n✅ Simple todo context test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSimpleTodoContext();
