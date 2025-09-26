import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Log from '@/models/Log';
import  connectDB  from './db';
import { JWT_SECRET, TOKEN_EXPIRY } from '@/config/constants';
import { sendEmail } from './send-email';

export const generateToken = (user) => {
  console.log(JWT_SECRET)
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      organization: user.organization
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
export const authenticate = async (request) => {
  const token = request.cookies.get('token')?.value;
    console.log('Extracted token:',typeof token); // Debug log
  if (!token.length>=1){ 
    console.log("Failure to extract token")
    return { user: null }
  };
  
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("Token could not be decoded!")
      return { user: null }
    };2
    
    await connectDB();
    const user = await User.findById(decoded.id);
    
    // Check session timeout (2 minutes)
    if (user && new Date() - new Date(user.lastActivity) > 20* 60 * 1000) {
      return { user: null, sessionExpired: true };
    }
    
    // Update last activity
    if (user) {
      user.lastActivity = Date.now();
      await user.save();
    }
    
    return { user };
  } catch (error) {
    console.log(error)
    return { user: null };
  }
};
export const logActivity = async (userId, action, ip, userAgent, details = {}) => {
  await connectDB();
  await Log.create({ user: userId, action, ip, userAgent, details });
};

export const sendVerificationEmail = async (email, token) => {
  // Implement email sending logic here
  const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;
  console.log(`Verification link for ${email}: ${verificationLink}`);
   await sendEmail({
      to: email,
      subject: 'Email Verification',
      text: `Click  here: ${verificationLink} to verify your email<br> ${verificationLink}`,
    });
  // In production, use a service like Nodemailer, SendGrid, etc.
};