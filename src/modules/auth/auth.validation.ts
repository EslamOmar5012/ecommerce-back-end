import { z } from 'zod';

export const Gender = ['male', 'female'] as const;
export const Role = ['user', 'admin'] as const;

export const signupSchema = {
    body: z.object({
        username: z.string().min(3, 'Username must be at least 3 characters').max(20),
        email: z.string().email('Invalid email address'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string(),
        phone: z.string().min(10, 'Phone number must be at least 10 characters'),
        age: z.number().min(13, 'Must be at least 13 years old').max(100),
        gender: z.enum(Gender),
        role: z.enum(Role).optional()
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })
};

export const loginSchema = {
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
        fcmToken: z.string().optional()
    })
};

export type SignupDto = z.infer<typeof signupSchema.body>;
export type LoginDto = z.infer<typeof loginSchema.body>;

