# Local network chat

## Start with two tabs

From this folder in PowerShell:

```powershell
npm.cmd install
npm.cmd start
```

Keep the terminal running. Open http://localhost:3000 in two browser tabs.
Both should say **Connected**. Enter `Rishav` as the name in tab A and `Alex`
in tab B. Send `Hello from tab A` in the first tab:
it should appear once in both tabs. Reply from the second tab and check both.
Stop the server with Ctrl+C.

## Windows setup: laptop and phone

1. Install Node.js LTS from https://nodejs.org if it is not already installed.
   Open a new PowerShell window and run `node --version` to check installation.
2. Open this project folder in File Explorer, click the address bar, type
   `powershell`, and press Enter. Run `npm.cmd install` once with internet access.
   The `.cmd` suffix avoids PowerShell script execution-policy problems.
3. Connect the laptop and phone to the same home Wi-Fi/router. The laptop may
   also use Ethernet on that router. The router must be running, but its internet
   connection is not needed once installation is complete.
4. Run `npm.cmd start`. Keep PowerShell open and the laptop awake.
5. The terminal prints **On this laptop** and **On your phone** URLs. Open
   `http://localhost:3000` on the laptop and the printed Wi-Fi/Ethernet URL on
   the phone, such as `http://192.168.1.42:3000`. Include `http://` and `:3000`.
   Never use `localhost` or `0.0.0.0` on the phone.
6. If Windows displays a firewall prompt for Node.js, allow access on **Private
   networks** for your trusted home network. In Windows Settings, go to
   **Network & internet**, open your connected Wi-Fi network or Ethernet
   properties, and choose **Private** for a trusted home network.
7. Enter `Laptop` and `Phone` as the names and send messages in both directions.

If several URLs appear, VPNs and virtual adapters may be included. Run
`ipconfig` and match the IPv4 address of the active Wi-Fi or Ethernet adapter.
If your IP changes after reconnecting to Wi-Fi, restart Node and use the newly
printed URL. Startup URLs are candidates; they do not prove the firewall or
router permits access.

### If the phone cannot connect

- First check that two laptop tabs still work at `http://localhost:3000`.
- Open the printed network URL on the laptop itself. If that works but the
  phone cannot open it, check the phone's Wi-Fi, firewall, and router isolation.
- Check **Windows Security → Firewall & network protection → Allow an app
  through firewall**. Allow the Node.js entry on Private networks. Do not turn
  off the firewall. On a managed school/work laptop, settings may require an
  administrator.
- If an explicit rule is needed, open **Windows Defender Firewall with Advanced
  Security → Inbound Rules → New Rule**. Choose **Port → TCP → Specific local
  ports: 3000 → Allow the connection → Private** only. Name it `Local chat 3000`.
  In the rule's Properties → Scope, limit remote IP addresses to **Local subnet**.
  This step can require administrator access. Remove the rule when no longer needed.
- Guest Wi-Fi or router client/AP isolation can prevent devices from talking.
  Use your trusted main network. Temporarily disconnect a VPN if it blocks LAN
  access. No router port forwarding is needed.
- If startup says `EADDRINUSE`, another process is already using port 3000.
  Stop your previous chat server with Ctrl+C before starting another one.

### Verify phone, laptop, and offline runtime

1. Check that both devices say **Connected**. Send `Hello from laptop` and
   `Hello from phone`; both devices should show each message exactly once,
   with `(you)` only on the sending device.
2. Open a second laptop tab. Send from it and check all three clients receive
   the message. The original two-tab chat still works.
3. To test without internet, keep both devices connected to the local router
   while its internet/WAN connection is unavailable. Disable phone cellular
   data for this test. Keep Wi-Fi on and Node running.
4. Refresh both pages and send messages again. Successful page loads and
   delivery confirm the app works without internet at runtime.
5. Optionally inspect the browser's Network panel while refreshing. The page,
   `/socket.io/socket.io.js`, and `/socket.io/…` requests should all use the
   laptop's host and port. There are no CDN scripts, external fonts, or images.

The HTML contains its CSS and app script. Socket.IO serves its browser library
from the installed local package. No dependency download occurs during
`npm.cmd start`. A second physical device must be verified on your own network.

## Connect by QR, including a laptop hotspot

The **Connect your phone** panel contains a chat URL QR. The server generates
the image using the installed `qrcode` package and sends it as a PNG data URL.
There is no external QR service. After pulling these changes, run
`npm.cmd install` once to install the new dependency, then restart the server.

1. On the laptop open **Settings → Network & internet → Mobile hotspot**.
   Choose **Share over Wi-Fi**, edit the network name/password if desired,
   and try enabling Mobile hotspot. Use 2.4 GHz if the phone cannot see it.
2. Join that network in the phone's Wi-Fi settings using the displayed password.
   If it reports **No internet**, choose to stay connected. Keep the hotspot on
   and the laptop awake; disable hotspot power saving if it turns off when idle.
3. Run `npm.cmd start` and open `http://localhost:3000` on the laptop.
4. Expand **Connect your phone** and click **Refresh addresses**. Choose the
   hotspot adapter (often a virtual adapter named `Local Area Connection* …`).
   Use `ipconfig` to match its IPv4 address if needed; do not assume a fixed IP.
5. Scan the displayed QR with the phone's camera and tap its link. If scanning
   is unavailable, type the displayed URL into the phone browser.
6. Enter different names and send messages both ways. Also open a second laptop
   tab to verify the original two-tab chat still works.
7. With the hotspot staying on, test without upstream internet and with phone
   cellular data off. Refresh the chat on both devices and exchange messages.
   If the hotspot shuts down, the local link is gone and chat will reconnect.

**Hotspot limitation:** Windows Mobile hotspot is designed to share an existing
connection. Windows may refuse to enable it with no available upstream connection.
The chat cannot override that restriction, and a browser cannot create a hotspot.
If Windows shows an error, record the exact text. A Wi-Fi router or travel router
with no internet connection supplies a reliable local network instead.
The legacy `netsh wlan` hosted-network method is unsupported by this laptop's
driver; that result alone does not establish modern Mobile hotspot support.

The QR joins the chat, not the Wi-Fi network. It does not change Windows settings,
open firewall ports, or verify reachability. Names and message history behave as
before. If the phone cannot load the link, use the firewall troubleshooting above.

Windows hotspot reference:
https://support.microsoft.com/en-us/windows/experience/connectivity-networking/use-your-windows-device-as-a-mobile-hotspot

## How a message travels

```text
Tab A -- chat message event --> Node server
                               |-- chat message event --> Tab A
                               |-- chat message event --> Tab B
```

1. Node serves `index.html` when the browser requests `/`.
2. `/socket.io/socket.io.js` supplies the browser client from the local server;
   no CDN or internet connection is needed after dependencies are installed.
3. Each tab calls `io()` to establish its own connection to the server.
4. Submitting the form calls `socket.emit('chat message', { name, text })`.
5. The server's `socket.on(...)` receives it, checks it, then calls `io.emit(...)`
   to send `{ name, text, senderId: socket.id }` to all connected clients,
   including its sender. The server adds the connection ID itself.
6. Each browser's `socket.on(...)` appends a list item using `textContent`.
   The sender waits for the same server event, so it does not show duplicates.
   Each tab compares `senderId` with its own `socket.id` to label its messages
   with `(you)`. Names are self-chosen display labels, not verified identities.
   Connection IDs can change when a tab reconnects.

The tabs communicate through Node, not directly with each other. `localhost`
means this computer; `3000` is the port identifying this server. Socket.IO
handles the ongoing connection, using WebSocket when available and HTTP
long-polling as a fallback.

## Verification

- Send messages in both directions; each appears exactly once per connected tab.
- Tab A should see `Rishav (you): Hello from tab A`; tab B should see
  `Rishav: Hello from tab A`. A reply from Alex should say `(you)` only in tab B.
- Try a whitespace-only message; it should not appear.
- Send `<b>Hello</b>`; it should appear as literal text, not bold HTML.
- Refresh one tab; its messages disappear because there is no saved history.
  New messages should still reach both tabs after it reconnects.
- Stop Node; both tabs should show Disconnected and disable Send. Restart Node;
  the tabs should reconnect automatically and new messages should work again.

The server listens on `0.0.0.0`, meaning all network interfaces. That is a
listening address, not the address to enter in the browser. The other device
must use your computer's LAN IP, because its own `localhost` points to itself.

This learning app has one shared room, no accounts, no saved history, and uses
unencrypted HTTP. Use it with non-sensitive messages on a trusted local network.
Messages sent while a tab is disconnected are not replayed when it reconnects.

Reference: https://socket.io/docs/v4/tutorial/step-5

Windows network setup reference:
https://support.microsoft.com/en-us/windows/experience/connectivity-networking/essential-network-settings-and-tasks-in-windows

Network address API reference: https://nodejs.org/api/os.html#osnetworkinterfaces
