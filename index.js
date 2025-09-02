// index.js
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");

// Préfixe des commandes
const PREFIX = "!";

// Numéro (info seulement)
const PHONE_NUMBER = "237696814391";

async function startBot() {
    // Auth multi-fichiers
    const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, 'auth_info'));

    // Store mémoire fonctionnel
    const store = makeCacheableSignalKeyStore(state, P({ level: 'silent' }));

    // Chargement dynamique des commandes
    const commands = new Map();
    const commandFiles = fs.existsSync(path.join(__dirname, "commands"))
        ? fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"))
        : [];
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.name) commands.set(command.name, command);
    }

    // Version WhatsApp
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        auth: state,
        printQRInTerminal: false
    });

    // Sauvegarde automatique des credentials
    sock.ev.on("creds.update", saveCreds);

    // Lier le store
    store.bind(sock.ev);

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

    // Gestion de la connexion
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connexion fermée, reconnect ?", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("Connecté au compte WhatsApp !");
        }
    });
}

startBot().catch(console.error);