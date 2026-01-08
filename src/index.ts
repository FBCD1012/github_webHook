import { startServer } from './server.js';
import { appConfig } from './config/index.js';

console.log('='.repeat(50));
console.log('Git Webhook Monitor');
console.log('='.repeat(50));

// Display monitored repositories
if (appConfig.monitors.length > 0) {
  console.log('\nMonitored repositories:');
  appConfig.monitors.forEach((m) => {
    console.log(`  - ${m.repo}`);
  });
} else {
  console.log('\nWarning: No repositories configured in config.yaml');
}

console.log('');

// Start the server
startServer();
