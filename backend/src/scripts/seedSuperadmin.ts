import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

dotenv.config();

const seedSuperadmin = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  const adminName = process.env.SUPERADMIN_NAME || 'Super Administrator';
  const adminEmail = (process.env.SUPERADMIN_EMAIL || 'admin@wellness.com').toLowerCase().trim();
  const adminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperSecretAdmin123!';

  try {
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to database.');

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== 'superadmin') {
        existingAdmin.role = 'superadmin';
        await existingAdmin.save();
        console.log(`[Seeder] Existing user ${adminEmail} upgraded to superadmin.`);
      } else {
        console.log(`[Seeder] Superadmin user ${adminEmail} already exists.`);
      }
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const superadmin = await User.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'superadmin',
        privacySettings: {
          shareNotesWithAdmin: true,
        },
      });

      console.log(`[Seeder] Created initial superadmin successfully:`);
      console.log(` - ID: ${superadmin.id}`);
      console.log(` - Name: ${superadmin.name}`);
      console.log(` - Email: ${superadmin.email}`);
      console.log(` - Default Password: ${adminPassword}`);
    }

    await mongoose.connection.close();
    console.log('[Seeder] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Failed to seed superadmin:', error);
    process.exit(1);
  }
};

seedSuperadmin();
