// Initialize MongoDB database for FocusFlow
db = db.getSiblingDB('focusflow');

// Create initial collections (empty)
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('rooms');

// Insert a test document to verify connection
db.test_connection.insertOne({
  message: 'MongoDB initialized successfully',
  createdAt: new Date()
});

print('MongoDB initialized for FocusFlow');
