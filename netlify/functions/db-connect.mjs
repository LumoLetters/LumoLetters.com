// netlify/functions/db-connect.mjs

import mongoose from 'mongoose';

let cachedConnection = null;

export async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not configured');
    throw new Error('MONGODB_URI environment variable not configured');
  }

  console.log('🔌 Attempting to connect to MongoDB...');
  console.log('📍 Connection URI format:', uri.replace(/\/\/.*@/, '//***:***@'));
  console.log('Current connection state before connect:', mongoose.connection.readyState);

  try {
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Closing existing connection...');
      await mongoose.disconnect();
    }

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000, // Increased for reliability
      connectTimeoutMS: 20000,
      maxPoolSize: 5,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      family: 4
    });

    cachedConnection = connection;
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      cachedConnection = null;
    });

    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      stack: error.stack
    });
    
    cachedConnection = null;
    
    if (error.name === 'MongoServerSelectionError') {
      throw new Error(`Database server unreachable: ${error.message}. Check cluster status, network access (0.0.0.0/0), or try a non-SRV connection string.`);
    } else if (error.name === 'MongoParseError') {
      throw new Error(`Invalid database connection string: ${error.message}`);
    } else if (error.name === 'MongoNetworkError') {
      throw new Error(`Network error connecting to database: ${error.message}`);
    } else {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
}

// User Schema with Onboarding Support

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  name: {
    type: String,
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  // Top-level address (mirrors onboarding.address)
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true, maxlength: 2 },
    zipCode: { type: String, trim: true },
    country: { type: String },
    specialInstructions: { type: String, maxlength: 500 }
  },

  interests: {
    type: [String],
    validate: {
      validator: arr => !arr || arr.length <= 10,
      message: 'Cannot have more than 10 interests'
    }
  },

  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled', 'trialing', 'paused'],
      default: 'inactive'
    },
    plan: String,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    trialEnd: Date
  },

  // Onboarding Progress
  profileComplete: {
    type: Boolean,
    default: false,
    index: true
  },
  profileStep: {
    type: String,
    enum: ['welcome', 'address', 'interests', 'experience', 'complete'],
    default: 'welcome',
    index: true
  },

  onboarding: {
    welcome: {
      name: { type: String, trim: true },
      subscribeNewsletter: Boolean
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true, maxlength: 2 },
      zipCode: { type: String, trim: true }
    },
    interests: {
      type: [String],
      validate: {
        validator: arr => !arr || arr.length <= 10,
        message: 'Cannot have more than 10 interests'
      }
    },
    complete: {
      profileComplete: Boolean
    }
  },

  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },

  app_metadata: {
    onboarding: {
      completed: Boolean,
      current_step: String,
      last_updated: Date
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'lumoletters_userprofiles'
});

// Virtual for formatted address
 
userSchema.virtual('formattedAddress').get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Middleware to sync onboarding address to top-level address & mark completion
 
userSchema.pre('save', function (next) {
  // Sync onboarding.address to top-level address
  if (this.onboarding?.address) {
    const { street, city, state, zipCode } = this.onboarding.address;
    this.address = {
      street,
      city,
      state,
      zipCode,
      country: this.address?.country || 'US',
      specialInstructions: this.address?.specialInstructions || ''
    };
  }

  if (this.isModified('onboarding.interests') && this.onboarding.interests) {
      this.interests = this.onboarding.interests;
  }
  
  // Ensure profileComplete gets set
  if (this.profileStep === 'complete' && !this.profileComplete) {
    this.profileComplete = true;
  }

  next();
});

// Letter Schema

const letterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  auth0Id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    minlength: 10
  },
  preview: {
    type: String,
    maxlength: 200
  },
  topics: {
    type: [String],
    index: true
  },
  sentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  mailStatus: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'delivered', 'failed'],
    default: 'draft',
    index: true
  },
  mailTrackingId: String,
  mailSentDate: Date
}, {
  timestamps: true,
  collection: 'lumoletters_userletters'
});

// Export models with proper error handling
 
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Letter = mongoose.models.Letter || mongoose.model('Letter', letterSchema);

// Migration helper to patch onboarding structure
 
export async function migrateExistingUsers() {
  try {
    console.log('🔄 Starting user migration...');
    await connectToDatabase();

    const result = await User.updateMany(
      {
        $or: [
          { onboarding: { $exists: false } },
          { 'onboarding.welcome': { $exists: false } },
          { 'onboarding.address': { $exists: false } },
          { 'onboarding.interests': { $exists: false } },
          { 'onboarding.complete': { $exists: false } },
          { profileStep: { $exists: false } },
          { profileComplete: { $exists: false } }
        ]
      },
      {
        $set: {
          'onboarding.welcome': { name: '', subscribeNewsletter: false },
          'onboarding.address': { street: '', city: '', state: '', zipCode: '' },
          'onboarding.interests': [],
          'onboarding.complete': { profileComplete: false },
          profileStep: 'welcome',
          profileComplete: false
        }
      }
    );

    console.log(`🔄 Migrated ${result.modifiedCount} user(s) with onboarding defaults`);
    return result;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Test database connection

export async function testConnection() {
  try {
    await connectToDatabase();
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    console.log('✅ Database ping successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Database ping failed:', error);
    return false;
  }
}

// Only run migration in development and only if connection succeeds

if (process.env.NODE_ENV === 'development') {
  testConnection().then(success => {
    if (success) {
      migrateExistingUsers().catch(console.error);
    }
  });
}