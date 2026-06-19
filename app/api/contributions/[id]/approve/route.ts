import { NextRequest, NextResponse } from 'next/server';

// The approval write (status + XP grant) is delegated to the Firebase callable
// `grantContributionXp`. Overridable via env for emulator/other projects.
const FUNCTION_URL =
  process.env.GRANT_CONTRIBUTION_XP_URL ||
  'https://us-central1-xplra-1.cloudfunctions.net/grantContributionXp';

// Map callable error codes -> HTTP status for the admin panel.
const STATUS_MAP: Record<string, number> = {
  NOT_FOUND: 404,
  FAILED_PRECONDITION: 409,
  INVALID_ARGUMENT: 400,
  UNAUTHENTICATED: 401,
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id;
    const body = await req.json();
    const contributionXp = Number(body?.contributionXp);

    if (!Number.isInteger(contributionXp) || contributionXp < 0) {
      return NextResponse.json({ error: 'Invalid contributionXp' }, { status: 400 });
    }

    const secret = process.env.GRANT_CONTRIBUTION_XP_SECRET;
    if (!secret) {
      console.error('GRANT_CONTRIBUTION_XP_SECRET environment variable is not set.');
      return NextResponse.json(
        { error: 'Server misconfiguration: contribution XP secret is not set' },
        { status: 500 }
      );
    }

    // Firebase callable protocol: POST { data: {...} } -> { result: {...} } | { error: {...} }
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { secret, placeId, contributionXp } }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.error) {
      const err = json?.error ?? {};
      const status = STATUS_MAP[err.status] ?? (res.status >= 400 ? res.status : 500);
      const message = err.message || 'Failed to approve contribution';
      console.error('grantContributionXp failed:', err.status || res.status, message);
      return NextResponse.json({ error: message }, { status });
    }

    const result = json?.result ?? {};
    return NextResponse.json({
      message: 'Contribution approved',
      placeId,
      contributionXp: result.xp_awarded ?? contributionXp,
    });
  } catch (error: unknown) {
    console.error('Approve contribution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
