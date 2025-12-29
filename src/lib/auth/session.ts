import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

// Require AUTH_SECRET in all environments
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export interface SessionData {
  userId: string;
  email: string;
  role: 'buyer' | 'dealer';
  dealerStatus?: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  iat: number;
  exp: number;
}

/**
 * Create a JWT session token
 */
export async function createSession(user: {
  id: string;
  email: string;
  role: 'buyer' | 'dealer';
  dealerStatus?: string;
  verified: boolean;
}): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    dealerStatus: user.dealerStatus,
    verified: user.verified,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Get session from HTTP-only cookie (server-side only)
 */
export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete('session');
}

/**
 * Validate request has dealer authentication
 */
export async function requireDealerAuth(request: Request): Promise<SessionData> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    throw new Error('Unauthorized');
  }

  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];

  if (!token) {
    throw new Error('Unauthorized');
  }

  const session = await verifySession(token);

  if (!session) {
    throw new Error('Invalid session');
  }

  if (session.role !== 'dealer') {
    throw new Error('Forbidden: Dealer access required');
  }

  if (session.dealerStatus !== 'approved') {
    throw new Error('Forbidden: Dealer not approved');
  }

  return session;
}

/**
 * Validate request has buyer authentication
 */
export async function requireBuyerAuth(request: Request): Promise<SessionData> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    throw new Error('Unauthorized');
  }

  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];

  if (!token) {
    throw new Error('Unauthorized');
  }

  const session = await verifySession(token);

  if (!session) {
    throw new Error('Invalid session');
  }

  if (session.role !== 'buyer') {
    throw new Error('Forbidden: Buyer access required');
  }

  return session;
}

/**
 * Validate request has any authentication
 */
export async function requireAuth(request: Request): Promise<SessionData> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    throw new Error('Unauthorized');
  }

  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];

  if (!token) {
    throw new Error('Unauthorized');
  }

  const session = await verifySession(token);

  if (!session) {
    throw new Error('Invalid session');
  }

  return session;
}

/**
 * Validate messaging action permissions based on role and seller_type
 */
export function validateMessagingPermission(
  session: SessionData,
  conversationData: {
    buyer_id: string;
    seller_id: string;
    seller_type: 'dealer' | 'buyer';
  },
  actingAs: 'buyer_id' | 'seller_id'
): boolean {
  if (session.role === 'buyer') {
    // Buyer can act as buyer_id in any conversation
    if (actingAs === 'buyer_id' && conversationData.buyer_id === session.userId) {
      return true;
    }
    // Buyer can act as seller_id ONLY when seller_type = 'buyer'
    if (
      actingAs === 'seller_id' &&
      conversationData.seller_id === session.userId &&
      conversationData.seller_type === 'buyer'
    ) {
      return true;
    }
    return false;
  }

  if (session.role === 'dealer') {
    // Dealer can act as seller_id ONLY when seller_type = 'dealer'
    if (
      actingAs === 'seller_id' &&
      conversationData.seller_id === session.userId &&
      conversationData.seller_type === 'dealer'
    ) {
      return true;
    }
    return false;
  }

  return false;
}
