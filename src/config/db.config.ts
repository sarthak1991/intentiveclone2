export const dbConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/focusflow',
  options: {
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
}
