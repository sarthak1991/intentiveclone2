import { z } from 'zod'

export const authErrorMessages = {
  invalidEmail: "That email doesn't look quite right. Could you double-check it?",
  emailExists: "An account with this email already exists. Would you like to log in instead?",
  weakPassword: "Let's make your password a bit stronger. How about adding some uppercase letters?",
  incorrectPassword: "Hmm, that password doesn't match. Try again or reset it if you forgot.",
  userNotFound: "We couldn't find an account with that email. Want to sign up?",
  magicLinkExpired: "That login link has expired. Let's send you a fresh one!",
  magicLinkSent: "Check your inbox! We sent a login link to your email.",
  emailRequired: "We'll need your email to get you set up.",
  passwordRequired: "Don't forget to enter your password.",
  nameRequired: "What should we call you?",
  passwordMinLength: "Passwords need at least 8 characters to keep your account secure.",
}

export const signupSchema = z.object({
  email: z.string()
    .min(1, { message: authErrorMessages.emailRequired })
    .email({ message: authErrorMessages.invalidEmail }),
  password: z.string()
    .min(8, { message: authErrorMessages.passwordMinLength })
    .refine((password) => /[A-Z]/.test(password) && /[a-z]/.test(password), {
      message: authErrorMessages.weakPassword
    }),
  name: z.string().min(1, { message: authErrorMessages.nameRequired })
})

export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: authErrorMessages.emailRequired })
    .email({ message: authErrorMessages.invalidEmail }),
  password: z.string().min(1, { message: authErrorMessages.passwordRequired })
})

export const magicLinkSchema = z.object({
  email: z.string()
    .min(1, { message: authErrorMessages.emailRequired })
    .email({ message: authErrorMessages.invalidEmail })
})

export const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, { message: authErrorMessages.emailRequired })
    .email({ message: authErrorMessages.invalidEmail })
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
