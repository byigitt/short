import mongoose from 'mongoose';

interface GlobalMongo {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: GlobalMongo | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

let cached: GlobalMongo = global.mongoose ?? {
  conn: null,
  promise: null,
};

// Initialize if not already initialized
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    const conn = await cached.promise;
    cached.conn = conn;
    return conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default connectDB; 