// xmtpUtils.ts
import { Client, Conversation } from "@xmtp/xmtp-js";

let xmtpClient: Client | null = null;

export async function initXMTPClient(privateKey: string): Promise<void> {
  xmtpClient = await Client.create(privateKey);
}

export async function sendXMTPMessage(
  recipientAddress: string,
  message: string
): Promise<void> {
  if (!xmtpClient) {
    throw new Error("XMTP client not initialized");
  }

  const conversation: Conversation = await xmtpClient.conversations.newConversation(
    recipientAddress
  );
  await conversation.send(message);
}

export async function sendFeedback(feedback: string): Promise<void> {
  try {
    const privateKey = process.env.NEXT_PUBLIC_XMTP_PRIVATE_KEY;
    const recipientAddress = process.env.NEXT_PUBLIC_FEEDBACK_RECIPIENT_ADDRESS;

    if (!privateKey || !recipientAddress) {
      console.error("XMTP private key or recipient address not configured");
      return;
    }

    await initXMTPClient(privateKey);
    await sendXMTPMessage(recipientAddress, feedback);

    console.log("Feedback sent successfully");
  } catch (error) {
    console.error("Error sending feedback:", error);
  }
}
