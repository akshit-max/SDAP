const { PrismaClient } = require('./packages/db');
const prisma = new PrismaClient();
const crypto = require('crypto');

function decrypt(encryptedHex, dekHex) {
  try {
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const dekBuffer = Buffer.from(dekHex, 'hex');
    const iv = encryptedBuffer.subarray(0, 12);
    const authTag = encryptedBuffer.subarray(12, 28);
    const ciphertext = encryptedBuffer.subarray(28);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', dekBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

async function test() {
  console.log('--- GMAIL OAUTH DIAGNOSTIC ---');
  
  // Just find ANY connection
  const connections = await prisma.integrationConnection.findMany();
  
  console.log(`Found ${connections.length} connections in DB.`);
  
  if (connections.length === 0) {
    console.log('❌ NO INTEGRATIONS CONNECTED AT ALL!');
    return;
  }
  
  for (const conn of connections) {
    console.log(`Connection: ID=${conn.id}, Provider=${conn.provider}, Status=${conn.status}`);
    
    // Attempt to decrypt access token
    const accessToken = decrypt(conn.encryptedToken, conn.encryptedDek);
    if (!accessToken) {
       console.log('  ❌ Failed to decrypt access token');
       continue;
    }
    
    console.log('  ✅ Decrypted Access Token');
    
    // Fetch latest email
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (res.ok) {
      console.log('  ✅ Gmail API SUCCESS (200 OK)');
      const data = await res.json();
      console.log(`  Found ${data.messages?.length || 0} messages.`);
      
      for (const msg of data.messages || []) {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value;
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value;
        console.log(`    - From: ${from}`);
        console.log(`      Subject: ${subject}`);
      }
    } else {
      console.log(`  ❌ Gmail API FAILED: ${res.status}`);
      console.log(await res.text());
    }
  }
  
  process.exit(0);
}

test();
