const ipfsClient = require('ipfs-http-client');
const { Agent } = require('https');

const ipfsAuth = import.meta.env['IPFS_AUTH'];
const ipfsURL = import.meta.env['IPFS_URL'];

if (!ipfsURL) {
  console.error("Must set IPFS_URL");
  process.exit(1);
}

(async function() {
  const client = ipfsClient.create({
    url: ipfsURL,
    headers: {
      authorization: ipfsAuth
    },
    agent: new Agent({
      keepAlive: false,
      maxSockets: Infinity
    })
  });

  console.log("Checking if online...", await client.isOnline())

  console.log("Created client...")

  console.log("Adding files...")
  let deployedApp = await client.add(ipfsClient.globSource('dist', { recursive: true }), { pin: true });

  const ipnsUpdate = await client.name.publish(deployedApp.cid, {key: "kolibri-frontend"})
  console.log(`Pushed ${deployedApp.path} [size=${deployedApp.size}, cid=${deployedApp.cid}]`);
  console.log(`ipnsUpdate -> ${JSON.stringify(ipnsUpdate)}`)

  console.log("Done! Visit https://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn.ipns.dweb.link/ for the updated version :)")
})();
