import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test environment variable
    const hasConfig = !!process.env.FIREBASE_ADMIN_SDK_JSON;

    if (!hasConfig) {
      return NextResponse.json({
        error: 'FIREBASE_ADMIN_SDK_JSON environment variable is not set',
        env: process.env.NODE_ENV
      }, { status: 500 });
    }

    // Try to parse the config
    try {
      const config = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);

      return NextResponse.json({
        success: true,
        message: 'Firebase config is valid',
        projectId: config.project_id,
        hasPrivateKey: !!config.private_key
      });
    } catch (parseError: any) {
      return NextResponse.json({
        error: 'Failed to parse FIREBASE_ADMIN_SDK_JSON',
        details: parseError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
