import nodemailer from "nodemailer";

export async function sendEmail(to, subject, text, html) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,          // TLS port
      secure: false,      // use STARTTLS instead of direct SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false, // 👈 allows Gmail’s cert chain locally
      },
    });

    const info = await transporter.sendMail({
      from: `Haastia <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}
