import { BrevoClient } from "@getbrevo/brevo";
import config from "../config/config.js";

async function sendOtpEmail(email, otp) {
  try {
    const brevo = await new BrevoClient({ apiKey: config.BREVO_API_KEY });
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `${otp} is your verification code`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f6f9fc;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e6ebf1;" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px;">Verify your identity</h2>
                      <p style="color: #555555; font-size: 15px; line-height: 24px;">Please use the following security code to complete your verification. Valid for 10 minutes.</p>
                      
                      <div style="background-color: #f4f5f7; border-radius: 6px; padding: 16px; margin: 24px 0; text-align: center; letter-spacing: 6px; font-family: monospace; font-size: 32px; font-weight: bold; color: #111111;">
                        ${otp}
                      </div>
                      
                      <p style="color: #777777; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      sender: { name: "Mike", email: "rajausamadev@gmail.com" },
      to: [{ email: email, name: "John Doe" }],
    });
    console.log("Email sent. Message ID:", result.messageId);
  } catch (error) {
    return { success: false, error };
  }
}

export default sendOtpEmail;
