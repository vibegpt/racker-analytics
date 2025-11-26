import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { Resend } from 'resend';

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const userEmail = email_addresses[0]?.email_address || '';

    try {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { clerkId: id },
      });

      let isNewUser = false;

      if (!existingUser) {
        // Create user in database
        const fullName = first_name && last_name
          ? `${first_name} ${last_name}`
          : first_name || last_name || null;

        await db.user.create({
          data: {
            clerkId: id,
            email: userEmail,
            name: fullName,
            avatarUrl: image_url || null,
          },
        });

        console.log(`User created in database: ${id}`);
        isNewUser = true;
      } else {
        console.log(`User already exists in database: ${id}`);
      }

      // Send email notification to admin (only for new users)
      if (isNewUser) {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          try {
            const resend = new Resend(resendApiKey);
            const userName = first_name && last_name
              ? `${first_name} ${last_name}`
              : first_name || last_name || 'Unknown';

            await resend.emails.send({
              from: 'Bagger <notifications@bagger.tools>',
              to: 'admin@bagger.tools',
              subject: '🎉 New User Sign-Up - Bagger',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #6366f1;">New User Signed Up!</h2>
                  <p>A new user just created an account on Bagger.</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>User ID:</strong> ${id}</p>
                    <p><strong>Signed up:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    View all users in your <a href="https://dashboard.clerk.com" style="color: #6366f1;">Clerk Dashboard</a>
                  </p>
                </div>
              `,
            });

            console.log(`Admin notification sent for user: ${userEmail}`);
          } catch (emailError) {
            // Don't fail the webhook if email fails
            console.error('Error sending admin notification:', emailError);
          }
        }
      }
    } catch (error) {
      console.error('Error in user.created webhook:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return new Response(
        JSON.stringify({
          error: 'Error processing webhook',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
