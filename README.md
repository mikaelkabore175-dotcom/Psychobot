# PSYCHO BOT 👨🏻‍💻

[![Node.js](https://img.shields.io/badge/Node.js->=18.0.0-green?logo=node.js&logoColor=white)](https://nodejs.org/) 
[![Status](https://img.shields.io/badge/Status-Online-brightgreen)]()

Psycho Bot est un bot WhatsApp **multifonctionnel** conçu pour automatiser des tâches, gérer des groupes, envoyer et extraire des médias, jouer de la musique et interagir avec les membres.  
Basé sur [Baileys](https://github.com/whiskeysockets/baileys), une librairie Node.js non officielle pour WhatsApp Web.

---

## ⚙️ Fonctionnalités

### Gestion des messages et groupes
- Réponses automatiques aux mentions et numéros spécifiques.
- Commandes d’administration : `!promote`, `!demote`, `!delete`.
- Mentionner tous les membres : `!tagall`.

### Médias
- Télécharger la **photo de profil** d’un utilisateur (`!pp`).
- Extraire et sauvegarder **tous les médias** (images, vidéos, voix), même **view once** (`!extract`).
- Télécharger et envoyer des fichiers MP3 (`!downloadbot`).

### Réactions
- Extraction automatique des médias depuis les **réactions** aux messages.
- Support pour ces emojis : ♥️, 😂, 😍, 👍.

### Musique
- Recherche et envoi de chansons depuis YouTube (`!play`), avec filtrage du contenu explicite.
- Compatible `yt-dlp` pour l’extraction audio.

---

## 📌 Installation

1. Cloner le dépôt :  
```bash
git clone https://github.com/psycho237-prog/Psychobot.git
cd Psychobot

2. Installer les dépendances :



yarn install
# ou npm install

3. Placer le fichier audio principal :



fichier.mp3 à la racine du projet.


4. Lancer le bot :



node index.js

Un QR code s’affichera la première fois pour connecter le bot à votre compte WhatsApp.



---

📝 Commandes disponibles

Commande	Description

!help	Affiche le menu d’aide complet.
!promote	Promouvoir un membre en admin.
!demote	Retirer le statut d’admin.
!delete	Supprimer un message (réponse requise).
!tagall	Mentionner tous les membres du groupe.
!pp	Télécharger la photo de profil d’un utilisateur.
!extract	Extraire un média dans votre chat privé (images, vidéos, voix).
!downloadbot	Télécharger et envoyer des MP3 comme messages vocaux.
!play	Rechercher et envoyer une chanson depuis YouTube.



---

🔧 Configuration

Numéro cible pour alertes MP3 : modifiable via TARGET_NUMBER dans index.js.

Préfixe des commandes : ! par défaut (PREFIX dans index.js).



---

⚠️ Conditions d’utilisation

Psycho Bot est non officiel et utilise WhatsApp Web.

L’usage est à vos risques (respectez les règles de WhatsApp).

Ne pas utiliser pour spam ou contenu illégal.

Les fichiers médias sont temporairement stockés et supprimés automatiquement.



---

📂 Structure du projet

Psychobot/
│
├─ commands/          # Toutes les commandes JS du bot
├─ auth_info/         # Infos d’authentification WhatsApp
├─ temp/              # Médias temporaires (supprimés après usage)
├─ index.js           # Fichier principal du bot
├─ database.js        # Gestion des utilisateurs et statistiques
├─ fichier.mp3        # Fichier audio principal
└─ package.json       # Dépendances Node.js


---

💡 Remarques

Compatible avec Node.js >= 18.0.0

Pour YouTube : assurez-vous que yt-dlp est installé pour !play.

Les logs aident à surveiller les réactions, commandes et erreurs.



---

Créé par Psycho 237 Prog
