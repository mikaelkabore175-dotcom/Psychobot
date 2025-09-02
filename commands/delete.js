module.exports = {
    name: "delete",
    run: async ({ sock, msg }) => {
        const from = msg.key.remoteJid;

        // Si c'est une réponse à un message
        const targetMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!targetMsg) {
            return sock.sendMessage(from, { text: "❌ Réponds à un message pour le supprimer." });
        }

        try {
            await sock.sendMessage(from, { delete: msg.message.extendedTextMessage.contextInfo.stanzaId });
        } catch (err) {
            console.error("Erreur delete:", err);
            await sock.sendMessage(from, { text: "❌ Impossible de supprimer ce message." });
        }
    }
};