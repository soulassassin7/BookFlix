// server/Control/Clerkwebhooks.js
import { Webhook } from 'svix';
import User from '../models/User.js';

export const clerkWebhooks = async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error("You need a CLERK_WEBHOOK_SECRET in your .env");
    }

    const headers = req.headers;
    const payload = req.body;
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).send("Error occurred -- no svix headers");
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err.message);
      return res.status(400).send("Error occurred during verification");
    }

    const { id, first_name, last_name, email_addresses, image_url } = evt.data;
    const eventType = evt.type;

    if (eventType === 'user.created') {
      await User.create({
        _id: id,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        email: email_addresses[0].email_address,
        image: image_url,
      });
      console.log(`New user ${first_name} was created and saved to DB.`);
    }

    return res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Clerk Webhook Error:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};