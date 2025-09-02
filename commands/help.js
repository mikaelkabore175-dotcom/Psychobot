const fs = require("fs");
const path = require("path");

module.exports = {
    name: "help",
    run: async ({ sock, msg }) => {
        const from = msg.key.remoteJid;

        // Récupère tous les fichiers .js du dossier commands
        const commandFiles = fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith(".js") && f !== "help.js" && f !== "about.js");

        const commandList = commandFiles.map(f => {
            const cmd = require(path.join(__dirname, f));
            return `• ${cmd.name}`;
        }).join("\n");

        const text = `📜 *Liste des commandes disponibles :*\n\n${commandList}`;

        await sock.sendMessage(from, { text });
    }
};