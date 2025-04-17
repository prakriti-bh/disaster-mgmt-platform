import { v4 as uuidv4 } from 'uuid';
import { withErrorHandler, validateRequest, successResponse, ApiError } from '@/utils/apiResponse';

// Mock user database (in production use a real database)
let users = [
  {
    userId: '1',
    email: 'john@example.com',
    password: 'password123',
    name: 'John Doe',
  }
];

const registrationSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 8 },
  name: { required: true, minLength: 2 },
  phone: { type: 'phone', required: false },
  pincode: { pattern: /^\d{6}$/, message: 'Invalid PIN code format', required: false }
};

export async function POST(request) {
  return withErrorHandler(request, async () => {
    const userData = await request.json();
    
    // Validate request data
    validateRequest(userData, registrationSchema);

    // Check if user already exists
    if (users.some(u => u.email === userData.email)) {
      throw new ApiError(409, 'Email already registered');
    }

    // Create new user
    const newUser = {
      userId: uuidv4(),
      createdAt: new Date().toISOString(),
      ...userData
    };

    // Remove sensitive fields from response
    const { password: _, ...userWithoutPassword } = newUser;

    // Save user (in production, save to database)
    users.push(newUser);

    return successResponse(userWithoutPassword, 201);
  });
}