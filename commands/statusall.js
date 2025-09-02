const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
    name: "statusall",
    run: async ({ sock, msg }) => {
        const from = msg.key.remoteJid;

        try {
            const statusList = await sock.statusBroadcast(); // récupère les statuts récents
            if (!statusList || statusList.length === 0) {
                return sock.sendMessage(from, { text: "❌ Aucun statut trouvé." });
            }

            for (let status of statusList) {
                const jid = status.id.split("_")[0] + "@s.whatsapp.net";

                // Télécharge le média si c'est une image ou vidéo
                if (status.mimetype) {
                    const buffer = await downloadMediaMessage({ message: status }, "buffer", {}, { logger: require("pino")({ level: "silent" }) });
                    await sock.sendMessage(from, { text: `📌 Statut de ${jid} vu !` });
                }
            }

            await sock.sendMessage(from, { text: "✅ Tous les statuts ont été consultés." });

        } catch (err) {
            console.error("Erreur statusall:", err);
            await sock.sendMessage(from, { text: "❌ Impossible de récupérer les statuts." });
        }
    }
};