import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendReceiptEmail = async ({ itemName, buyerName, buyerEmail, price, pickupLocation, pickupDate, sellerEmail }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TigerTrade" <${process.env.GMAIL_USER}>`,
      to: sellerEmail,
      replyTo: buyerEmail,
      subject: `New Order Received: ${itemName}`,
      html: `
        <h2>New Order Receipt</h2>
        <p><strong>Item:</strong> ${itemName}</p>
        <p><strong>Buyer:</strong> ${buyerName} (${buyerEmail})</p>
        <p><strong>Price:</strong> $${price}</p>
        <p><strong>Pick-up Location:</strong> ${pickupLocation}</p>
        <p><strong>Pick-up Date:</strong> ${new Date(pickupDate).toLocaleString()}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Nodemailer error:", err);
    throw err;
  }
};