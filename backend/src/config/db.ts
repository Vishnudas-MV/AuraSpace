import mongoose from 'mongoose';

let isConnecting = false;

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('===============================================================');
    console.error(' [DATABASE CONFIGURATION ERROR]');
    console.error(' MONGODB_URI is not defined in your environment variables!');
    console.error(' On Render, go to your Web Service -> Environment -> Add Environment Variable:');
    console.error(' Key:   MONGODB_URI');
    console.error(' Value: mongodb+srv://<username>:<password>@cluster0.../mental_wellness?retryWrites=true&w=majority');
    console.error('===============================================================');
    return;
  }

  if (isConnecting || mongoose.connection.readyState === 1) {
    return;
  }

  isConnecting = true;

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `[Database] MongoDB connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`
    );
    isConnecting = false;
  } catch (error: any) {
    isConnecting = false;
    console.error('===============================================================');
    console.error('[Database Connection Failed]:', error.message || error);
    console.error('Most common solutions:');
    console.error('1. MongoDB Atlas Network Access: Go to Network Access in Atlas and add 0.0.0.0/0 (Allow Access from Anywhere), as Render uses dynamic IPs.');
    console.error('2. Database User Credentials: Ensure the username and password in MONGODB_URI are correct in the Render Environment tab.');
    console.error('3. Special Characters: If your password contains special characters (e.g. @, #, %), URL-encode them (e.g. @ -> %40).');
    console.error('===============================================================');

    // Retry connection automatically without crashing the server process
    console.log('[Database] Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB connection error:', err?.message || err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected. Reconnection will be attempted...');
});

// Process termination handlers
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[Database] Connection closed due to application termination (SIGINT).');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('[Database] Connection closed due to application termination (SIGTERM).');
  process.exit(0);
});
