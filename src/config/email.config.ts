export const emailConfig = {
  host: process.env.EMAIL_SERVER_HOST || 'smtp.resend.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  from: process.env.EMAIL_FROM || 'noreply@focusflow.com',
}
