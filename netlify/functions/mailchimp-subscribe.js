// Netlify Function to handle Mailchimp subscription
// This avoids CORS issues by calling Mailchimp from the server side

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    // Validate email
    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email' })
      };
    }

    // Read from environment variables (set in Netlify dashboard)
    const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_SERVER = process.env.MAILCHIMP_SERVER || 'us5';

    const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

    const data = {
      email_address: email,
      status: 'pending',
      merge_fields: {}
    };

    const auth = Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // Success if 200 OK or 400 (email already exists)
    if (response.ok || response.status === 400) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Email added to waitlist' })
      };
    }

    // Handle other errors
    const errorData = await response.text();
    console.error('Mailchimp error:', errorData);

    return {
      statusCode: response.status,
      body: JSON.stringify({ error: 'Failed to subscribe' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
