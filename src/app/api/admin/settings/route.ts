import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET all settings
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const allSettings = await db.query.siteSettings.findMany();

    // Transform array of settings into an object
    const settingsObject: Record<string, any> = {};

    allSettings.forEach((setting) => {
      settingsObject[setting.key] = setting.value;
    });

    return NextResponse.json({ settings: settingsObject });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}, 'admin');

// PATCH (update) settings
export const PATCH = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Update or create each setting
    for (const [key, value] of Object.entries(body)) {
      // Check if setting exists
      const existingSetting = await db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, key),
      });

      if (existingSetting) {
        // Update existing setting
        await db
          .update(siteSettings)
          .set({
            value: value as any,
            updatedAt: new Date(),
          })
          .where(eq(siteSettings.key, key));
      } else {
        // Create new setting
        await db.insert(siteSettings).values({
          key,
          value: value as any,
          type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
          isPublic: false,
        });
      }
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}, 'admin');
