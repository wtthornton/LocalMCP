/**
 * Debug test for todo creation
 */

import { TodoService } from './dist/services/todo/todo.service.js';
import { Logger } from './dist/services/logger/logger.js';

async function testDebugTodo() {
  console.log('🧪 Debug Todo Creation...\n');

  try {
    // Initialize services
    const logger = new Logger('Test-DebugTodo');
    const todoService = new TodoService('test-debug-todos.db');
    
    console.log('✅ TodoService initialized\n');

    // Try to create a todo with minimal data
    console.log('📝 Creating minimal todo...');
    const result = await todoService.createTodo({
      projectId: 'test-project',
      title: 'Test todo'
    });
    
    console.log('✅ Todo created:', result);
    console.log('Todo ID:', result.data?.id);

    // List all todos
    console.log('\n🔍 Listing all todos...');
    const allTasks = await todoService.listTodos('test-project', {});
    console.log('All tasks result:', allTasks);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      context: error.context
    });
  }
}

// Run the test
testDebugTodo();
