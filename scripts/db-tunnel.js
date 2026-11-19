const net = require('net');
const dns = require('dns');

// Use public reliable DNS servers to bypass local ISP DNS blocking of neon.tech
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

// --- NOTE (2026-11-19): ep-fancy-hat is currently out of limit. Real DB reached quota limit today 19 Nov 2026. DO NOT DELETE. ---
// const REMOTE_HOST = 'ep-fancy-hat-ao4qzylp-pooler.c-2.ap-southeast-1.aws.neon.tech';
// let cachedIp = '13.251.17.193';

// Active DB (switched on 2026-11-19 to ep-rapid-morning-b3xcf3ak):
const REMOTE_HOST = 'ep-rapid-morning-b3xcf3ak-pooler.c-4.ap-southeast-1.aws.neon.tech';
const REMOTE_PORT = 5432;
const LOCAL_PORT = 5433;

let cachedIp = '52.76.212.156';

function refreshDns() {
  dns.resolve4(REMOTE_HOST, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      cachedIp = addresses[0];
      console.log(`[db-tunnel] Resolved ${REMOTE_HOST} -> ${cachedIp}`);
    } else if (err) {
      console.warn(`[db-tunnel] DNS refresh warning:`, err.message);
    }
  });
}

// Initial DNS resolve and periodic refresh
refreshDns();
setInterval(refreshDns, 5 * 60 * 1000);

const server = net.createServer((clientSocket) => {
  const remoteSocket = net.connect(REMOTE_PORT, cachedIp);

  clientSocket.pipe(remoteSocket);
  remoteSocket.pipe(clientSocket);

  remoteSocket.on('error', (err) => {
    console.warn('[db-tunnel] Remote socket warning:', err.message);
    clientSocket.destroy();
  });

  clientSocket.on('error', (err) => {
    console.warn('[db-tunnel] Client socket warning:', err.message);
    remoteSocket.destroy();
  });
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
  console.log(`[db-tunnel] Neon DB TCP tunnel active on 127.0.0.1:${LOCAL_PORT} -> ${REMOTE_HOST}:${REMOTE_PORT}`);
});

server.on('error', (err) => {
  console.error('[db-tunnel] Server error:', err.message);
});
