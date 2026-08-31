import { z } from "zod";

// 1. Zod Validation Schemas
export const RegisterDTOSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const LoginDTOSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// 2. Infer TypeScript Types from Schemas
export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;
export type LoginDTO = z.infer<typeof LoginDTOSchema>;

// 3. User Response DTO (To exclude sensitive fields like passwordHash)
export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  preferredStandardCode: string;
  createdAt: Date;
}

// 4. Session Payload DTO
export interface SessionPayloadDTO {
  userId: string;
  email: string;
  role: "user" | "admin";
}