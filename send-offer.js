export const sendOfferEmail = async (
  {
    itemName,
    postId,
    amount,
    note,
    buyerEmail,
    buyerName,
    sellerEmail,
  },
  transporter
) => {
  if (!sellerEmail) throw new Error("sellerEmail is missing");
  if (!buyerEmail) throw new Error("buyerEmail is missing");
  if (!itemName) throw new Error("itemName is missing");
  if (!amount) throw new Error("offer amount is missing");

  const num = Number(amount);
  const formattedAmount = Number.isInteger(num) ? num.toFixed(0) : num.toFixed(2);

  const base = "http://localhost:5000/respond-offer";
  const commonParams = `buyerEmail=${encodeURIComponent(buyerEmail)}&buyerName=${encodeURIComponent(buyerName || "")}&amount=${encodeURIComponent(formattedAmount)}&itemName=${encodeURIComponent(itemName)}&postId=${encodeURIComponent(postId || "")}&sellerEmail=${encodeURIComponent(sellerEmail)}`;

  const acceptUrl = `${base}?decision=accept&${commonParams}`;
  const declineUrl = `${base}?decision=decline&${commonParams}`;

  const html = `
    <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#333; margin-bottom:8px;">New Offer for: ${itemName}</h2>

      <p style="margin-bottom:10px;">
        <strong>Buyer:</strong> ${buyerName || "Unknown Buyer"} (${buyerEmail})
      </p>
      <p style="margin-bottom:18px;"><strong>Offer Amount:</strong> $${formattedAmount}</p>
      ${note ? `<p style="white-space:pre-wrap; margin-bottom:18px;"><strong>Buyer Note:</strong><br/>${note.replace(/\n/g, "<br/>")}</p>` : ""}

      <div style="margin-top:10px;">
        <a href="${acceptUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block; padding:12px 24px; background:#4CAF50; color:white; border-radius:6px; font-size:16px;">ACCEPT</a>
        <span style="display:inline-block; width:16px;"></span>
        <a href="${declineUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block; padding:12px 24px; background:#F44336; color:white; border-radius:6px; font-size:16px;">DECLINE</a>
      </div>

      <p style="margin-top:18px; color:#777; font-size:12px;">
        TigerTrade: For a Safe Campus Market
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"TigerTrade" <${process.env.GMAIL_USER}>`,
    to: sellerEmail,
    subject: `New Offer Received for ${itemName}`,
    html,
  });
};