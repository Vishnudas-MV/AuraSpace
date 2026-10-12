import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('Fatal Error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Attempting to reconnect...');
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed due to application termination (SIGINT).');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed due to application termination (SIGTERM).');
      process.exit(0);
    });
  } catch (error) {
    console.error('[Database] Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};
