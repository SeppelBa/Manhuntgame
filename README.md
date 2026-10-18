# MANHUNT – Einrichtung (ca. 10 Minuten)

## 1. Firebase (die Räume/Gruppen)
1. https://console.firebase.google.com → **Projekt hinzufügen** (Analytics kannst du ausschalten).
2. **Build → Authentication → Los geht's → Anonym → aktivieren.** (Dadurch merkt sich jedes Handy automatisch, wer es ist.)
3. **Build → Realtime Database → Datenbank erstellen** (beliebiger Standort, Testmodus ist ok). Danach Reiter **Regeln**: Inhalt von `database.rules.json` einfügen und veröffentlichen.
4. **Projekteinstellungen (Zahnrad) → Deine Apps → Web-Symbol `</>`** → App registrieren → den Block `firebaseConfig` kopieren und die Werte in `firebase-config.js` eintragen (`databaseURL` steht dort mit drin; falls nicht, sie steht oben in der Realtime Database).

Kostenlos im Spark-Tarif, für Freundesgruppen reicht das locker.

## 2. GitHub Pages
1. Neues Repository auf github.com (public).
2. **Add file → Upload files**: den **Inhalt** dieses Ordners hochladen (nicht den Ordner selbst), inklusive `vendor/`.
3. **Settings → Pages → Branch: main, Ordner: / (root) → Save.**
4. Nach ca. 1 Minute steht oben der Link `https://DEINNAME.github.io/REPONAME/`. Den schickst du deinen Freunden.

Tipp: Am iPhone **Teilen → Zum Home-Bildschirm**, am Android-Handy **Menü → App installieren**.

## 3. Spielen
- Standort erlauben. Host erstellt Spiel, stellt auf der Karte den Mittelpunkt ein (Tippen oder „Startpunkt = meine Position“), die anderen geben den Code ein.
- **Zurück ins Spiel:** Das Handy merkt sich Spieler und Code. Nach einem Absturz einfach die Seite neu öffnen, dann geht es automatisch weiter. Bei gelöschten Browserdaten oder neuem Handy: Code + exakt denselben Namen eingeben.

## Probleme
- `auth/unauthorized-domain`: In Firebase unter Authentication → Settings → Authorisierte Domains `DEINNAME.github.io` hinzufügen.
- Kein Standort: Seite muss über https laufen (GitHub Pages tut das) und der Browser muss Standort erlauben.
