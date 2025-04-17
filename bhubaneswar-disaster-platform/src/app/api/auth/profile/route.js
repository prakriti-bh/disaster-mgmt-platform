import { withErrorHandler, validateRequest, successResponse, ApiError, validateAuthToken } from '@/utils/apiResponse';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock user database
const users = [
  {
    userId: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main St',
    pincode: '751001'
  }
];

const profileUpdateSchema = {
  name: { required: false, minLength: 2 },
  phone: { required: false, type: 'phone' },
  address: { required: false },
  pincode: { required: false, pattern: /^\d{6}$/, message: 'Invalid PIN code format' }
};

export async function GET(request) {
  return withErrorHandler(request, async () => {
    const token = validateAuthToken(request);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = users.find(u => u.userId === decoded.userId);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Remove sensitive data
      const { password: _, ...userProfile } = user;
      return successResponse(userProfile);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw error;
    }
  });
}

export async function PATCH(request) {
  return withErrorHandler(request, async () => {
    const token = validateAuthToken(request);
    const updates = await request.json();
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userIndex = users.findIndex(u => u.userId === decoded.userId);
      
      if (userIndex === -1) {
        throw new ApiError(404, 'User not found');
      }

      // Validate update data
      validateRequest(updates, profileUpdateSchema);
      
      // Only allow updating certain fields
      const allowedUpdates = ['name', 'phone', 'address', 'pincode'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});
      
      // Update user
      users[userIndex] = {
        ...users[userIndex],
        ...filteredUpdates,
        updatedAt: new Date().toISOString()
      };

      // Remove sensitive data from response
      const { password: _, ...updatedProfile } = users[userIndex];
      return successResponse(updatedProfile);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw error;
    }
  });
}