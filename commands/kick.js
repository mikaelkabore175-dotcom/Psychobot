module.exports = {
    name: "kick",
    description: "Exclut un ou plusieurs membres du groupe (usage : !kick <numéro(s)> ou !kick @membre(s))",
    adminOnly: true,
    run: async ({ sock, msg, args }) => {
        const from = msg.key.remoteJid;
        const MY_NUMBER = "237696814391@s.whatsapp.net"; // Ton numéro personnel

        if (!from.endsWith("@g.us")) {
            return sock.sendMessage(from, { text: "❌ Cette commande ne fonctionne que dans un groupe." });
        }

        const groupMetadata = await sock.groupMetadata(from);
        const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        const senderIsAdmin = groupMetadata.participants.some(
            p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
        );

        console.log("========== [DEBUG KICK] ==========");
        console.log("Sender        :", sender);
        console.log("BotNumber     :", botNumber);
        console.log("SenderIsAdmin :", senderIsAdmin);
        console.log("Admins        :", groupMetadata.participants.filter(p => p.admin));
        console.log("==================================");

        // Autorisé si : sender est ton numéro perso OU sender est admin du groupe
        if (!(sender === MY_NUMBER || senderIsAdmin)) {
            return sock.sendMessage(from, { text: "❌ Tu dois être admin pour utiliser cette commande." });
        }

        // Vérifie si le bot est admin dans le groupe
        const botIsAdmin = groupMetadata.participants.some(
            p => p.id === botNumber && (p.admin === "admin" || p.admin === "superadmin")
        );

        if (!botIsAdmin) {
            return sock.sendMessage(from, {
                text: "❌ Je dois être admin pour exclure des membres."
            });
        }

        // Vérifie si l’utilisateur a mentionné quelqu’un
        const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const numbers = args.map(num => num.replace(/[^0-9]/g, "") + "@s.whatsapp.net");

        // Liste des JIDs à exclure (hors bot et sender)
        const toRemove = [...mentions, ...numbers].filter(jid => jid && jid !== botNumber && jid !== sender);

        if (!toRemove.length) {
            return sock.sendMessage(from, { text: "❌ Mentionne ou fournis un numéro valide à exclure." });
        }

        // Empêche d’exclure les admins
        const admins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id);

        const finalList = toRemove.filter(jid => !admins.includes(jid));

        if (!finalList.length) {
            return sock.sendMessage(from, { text: "❌ Impossible d’exclure des admins." });
        }

        try {
            await sock.groupParticipantsUpdate(from, finalList, "remove");
            sock.sendMessage(from, {
                text: `✅ Exclusion réussie :\n${finalList.map(j => "• @" + j.split("@")[0]).join("\n")}`,
                mentions: finalList
            });
        } catch (err) {
            sock.sendMessage(from, { text: "❌ Erreur lors de l’exclusion. Vérifie mes permissions." });
            console.error(err);
        }
    }
};