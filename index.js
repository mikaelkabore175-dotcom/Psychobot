// index.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Route simple pour vérifier que le service tourne
app.get("/", (req, res) => {
  res.send("Bot WhatsApp en ligne ✅");
});

// Démarrage du serveur web
app.listen(PORT, () => {
  console.log(`Web service actif sur le port ${PORT}`);
});

// ----- Bot WhatsApp -----
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");

// Préfixe des commandes
const PREFIX = "!";

// Authentification QR code
const { state, saveState } = useSingleFileAuthState(path.resolve(__dirname, 'auth_info.json'));

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: P({ level: 'silent' })
    });

    // Sauvegarde automatique des credentials
    sock.ev.on('creds.update', saveState);

    // Gestion de la connexion et du QR code
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("Scan this QR code with WhatsApp:", qr); // Affiche le QR code dans les logs
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connexion fermée, reconnect ?', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Connecté au compte WhatsApp !');
        }
    });

    // Chargement dynamique des commandes
    const commands = new Map();
    const commandFiles = fs.existsSync(path.join(__dirname, "commands"))
        ? fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"))
        : [];
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.name) commands.set(command.name, command);
    }

    // Gestion des messages entrants
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            const text = msg.message.conversation;
            if (text.startsWith(PREFIX)) {
                const args = text.slice(PREFIX.length).trim().split(/ +/);
                const cmdName = args.shift().toLowerCase();
                const command = commands.get(cmdName);
                if (command) {
                    try {
                        await command.run({ sock, msg, args });
                    } catch (err) {
                        console.error(err);
                        await sock.sendMessage(msg.key.remoteJid, { text: "Erreur lors de l'exécution de la commande." });
                    }
                }
            }
        }
    });
}

startBot().catch(console.error);