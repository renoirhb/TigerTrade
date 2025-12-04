import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { sendOfferEmail } from "./send-offer.js";
import { sendOfferResponseEmail } from "./send-offer-response.js";

dotenv.config();

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",  
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, 
  },
});

transporter.verify((err) => {
  if (err) console.error(err);
  else console.log("SMTP server ready");
});

{/* ORDER CONFIRMATION */}
app.post("/send-receipt", async (req, res) => {
  try {
    const { itemName, buyerName, buyerEmail, price, pickupLocation, pickupDate, sellerEmail } = req.body;
    if (!itemName || !buyerName || !buyerEmail || !price || !pickupLocation || !pickupDate || !sellerEmail)
      return res.status(400).json({ error: "Missing required fields" });

    const mailOptions = {
      from: `"TigerTrade" <${process.env.GMAIL_USER}>`,
      to: sellerEmail,
      replyTo: buyerEmail,
      subject: `New Order: ${itemName}`,
      html: `
        <h2>Order Receipt</h2>
        <p><strong>Item:</strong> ${itemName}</p>
        <p><strong>Buyer:</strong> ${buyerName} (${buyerEmail})</p>
        <p><strong>Price:</strong> $${price}</p>
        <p><strong>Pickup:</strong> ${pickupLocation} on ${new Date(pickupDate).toLocaleString()}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Nodemailer error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

{/* OFFER MAKING */}
app.post("/send-offer", async (req, res) => {
  try {
    const { itemName, buyerEmail, buyerName, amount, note, sellerEmail, sellerName } = req.body;
    if (!itemName || !buyerEmail || !buyerName || !amount || !sellerEmail) {
      return res.status(400).json({ error: "Missing required fields for offer" });
    }
    await sendOfferEmail({ itemName, amount, note, buyerEmail, buyerName, sellerEmail, sellerName }, transporter);

    res.json({ message: "Offer email sent successfully" });
  } catch (err) {
    console.error("send-offer error:", err);
    res.status(500).json({ error: "Failed to send offer email", details: err.message });
  }
});

app.get("/respond-offer", async (req, res) => {
  try {
    const { decision, buyerEmail, buyerName, sellerEmail, sellerName, amount, itemName } = req.query;
    if (!decision || !buyerEmail || !amount || !itemName) {
      return res.status(400).send("Missing required fields in the link.");
    }
    if (!sellerEmail) {
      return res.status(400).send("Seller email missing from link; cannot continue.");
    }

    // Send response email to buyer
    await sendOfferResponseEmail(
      {
        decision,
        buyerEmail,
        buyerName,
        sellerEmail,
        sellerName,
        amount,
        itemName,
      },
      transporter
    );

    // Confirmation page shown to seller
    const cleanAmount = Number(amount).toFixed( (Number(amount) % 1 === 0) ? 0 : 2 );
    const message = decision === "accept"
      ? `You have accepted the $${cleanAmount} offer for "${itemName}". The buyer has been notified.`
      : `You have declined the $${cleanAmount} offer for "${itemName}". The buyer has been notified.`;

    res.send(`
      <html>
        <head>
          <title>Offer ${decision === "accept" ? "Accepted" : "Declined"}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .accept { color: green; font-weight: bold; }
            .decline { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Offer ${decision === "accept" ? "Accepted" : "Declined"}</h1>
            <p class="${decision === "accept" ? "accept" : "decline"}">${message}</p>
            <p style="color:#666; font-size:13px;">You can close this page now.</p>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("Offer response error:", err);
    res.status(500).send("Error processing offer response.");
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));