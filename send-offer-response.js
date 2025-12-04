export const sendOfferResponseEmail = async (
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
) => {
  if (!buyerEmail) throw new Error("buyerEmail is missing");
  if (!sellerEmail) throw new Error("sellerEmail is missing");
  if (!decision) throw new Error("decision is missing");
  if (!itemName) throw new Error("itemName is missing");

  const cleanAmount = Number(amount);
  const formattedAmount = Number.isInteger(cleanAmount) ? cleanAmount.toFixed(0) : cleanAmount.toFixed(2);
  const isAccepted = decision === "accept";

  const message = isAccepted
    ? `${sellerName || "The seller"} accepted your $${formattedAmount} offer for <strong>${itemName}</strong>.`
    : `${sellerName || "The seller"} declined your $${formattedAmount} offer for <strong>${itemName}</strong>.`;

  const title = isAccepted ? "Your Offer Has Been Accepted!" : "Your Offer Has Been Declined";

  const html = `
    <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
      <h2>${title}</h2>

      <p>
        <strong>Item:</strong> ${itemName}<br/>
        <strong>Offer Amount:</strong> $${formattedAmount}
      </p>

      <p>
        <strong>Buyer:</strong> ${buyerName || "Buyer"}<br/>
      </p>

      <p style="margin-top:15px;">${message}</p>

      ${
        isAccepted
          ? `<p style="margin-top:15px;">If you are still interested in buying this item, go to Posts to choose payment method, and pick-up date and location.</p>`
          : `<p style="margin-top:15px;">Feel free to make another offer or contact the seller for more details.</p>`
      }

      <br/>
      <p style="color:#777;font-size:12px;">TigerTrade: For a Safe Campus Market</p>
    </div>
  `;

  return transporter.sendMail({
    from: `"TigerTrade" <${process.env.GMAIL_USER}>`,
    to: buyerEmail,
    subject: `Offer Update: ${itemName}`,
    html,
  });
};