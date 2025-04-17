import jwt from 'jsonwebtoken';
import { withErrorHandler, validateRequest, successResponse, ApiError } from '@/utils/apiResponse';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock user database (in production, use a real database)
const users = [
  {
    userId: '1',
    email: 'john@example.com',
    password: 'password123', // In production, use hashed passwords
    name: 'John Doe',
  }
];

const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 8 }
};

export async function POST(request) {
  return withErrorHandler(request, async () => {
    const data = await request.json();
    
    // Validate request data
    validateRequest(data, loginSchema);
    
    const { email, password } = data;

    // Find user (in production, use proper database query)
    const user = users.find(u => u.email === email);
    
    if (!user || user.password !== password) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    return successResponse({
      user: userWithoutPassword,
      token
    });
  });
}