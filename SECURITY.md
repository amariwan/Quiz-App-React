# Quiz App - Sicherheitsdokumentation

## 🔒 End-to-End Verschlüsselung (E2E)

Die Quiz-App implementiert eine umfassende End-to-End-Verschlüsselung zum Schutz sensibler Daten.

### Implementierte Verschlüsselungsfunktionen

#### 1. **AES-GCM Verschlüsselung**

- **Algorithmus**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Schlüssellänge**: 256 Bit
- **IV-Länge**: 96 Bit (optimal für GCM)
- **Anwendung**: Client-seitige Verschlüsselung von Fragen und Antworten

#### 2. **Verschlüsselungsablauf**

```
Benutzer startet Quiz
    ↓
Generierung eines eindeutigen Sitzungsschlüssels (Session Key)
    ↓
Verschlüsselte Übertragung der Fragen vom Server
    ↓
Lokale Verschlüsselung und Speicherung im SessionStorage
    ↓
Verschlüsselte Übermittlung der Antworten
    ↓
Sichere Ergebnisübertragung
```

#### 3. **Datenschutz-Features**

- **Session-basierte Verschlüsselung**: Jede Sitzung erhält einen eindeutigen Schlüssel
- **Lokale Datenverschlüsselung**: Fragen werden lokal verschlüsselt gespeichert
- **Integritätsprüfung**: SHA-256 Hashes zur Verifizierung der Datenintegrität
- **Automatische Session-Bereinigung**: Verschlüsselte Daten werden beim Neustart gelöscht

### Verwendete Klassen

#### `E2EEncryption` Klasse

```typescript
// Schlüssel generieren
const key = await E2EEncryption.generateKey();

// Daten verschlüsseln
const encrypted = await E2EEncryption.encrypt(data, key);

// Daten entschlüsseln
const decrypted = await E2EEncryption.decrypt(encrypted, key);

// Integritätshash generieren
const hash = await E2EEncryption.generateHash(data);

// Hash verifizieren
const isValid = await E2EEncryption.verifyHash(data, hash);
```

---

## 🛡️ Sicherheitsüberwachung (Security Monitoring)

### Monitoring-System

Das Security Monitoring System überwacht alle sicherheitsrelevanten Ereignisse in Echtzeit.

#### Event-Typen

| Event-Typ                  | Beschreibung                       | Sicherheitsstufe |
| -------------------------- | ---------------------------------- | ---------------- |
| `ENCRYPTION_KEY_GENERATED` | Verschlüsselungsschlüssel erstellt | INFO             |
| `DATA_ENCRYPTED`           | Daten verschlüsselt                | INFO             |
| `DATA_DECRYPTED`           | Daten entschlüsselt                | INFO             |
| `API_REQUEST`              | API-Anfrage                        | INFO             |
| `QUIZ_STARTED`             | Quiz gestartet                     | INFO             |
| `QUIZ_SUBMITTED`           | Quiz eingereicht                   | INFO             |
| `RATE_LIMIT_EXCEEDED`      | Rate-Limit überschritten           | WARNING          |
| `VALIDATION_FAILED`        | Validierung fehlgeschlagen         | WARNING          |
| `SUSPICIOUS_ACTIVITY`      | Verdächtige Aktivität              | WARNING          |
| `ERROR_OCCURRED`           | Fehler aufgetreten                 | CRITICAL         |

#### Sicherheitsstufen

- **INFO**: Informative Ereignisse (normale Operationen)
- **WARNING**: Warnungen (potenzielle Sicherheitsprobleme)
- **CRITICAL**: Kritische Ereignisse (ernste Sicherheitsprobleme)

### Security Dashboard

Die App zeigt ein Live-Security-Dashboard an:

- ✅ **Verschlüsselungsstatus**: Zeigt an, ob Verschlüsselung aktiv ist
- 📊 **Event-Zusammenfassung**: Anzahl der Events nach Sicherheitsstufe
- 📋 **Aktuelle Events**: Die letzten 10 Sicherheitsereignisse
- 💾 **Audit-Log Export**: Möglichkeit zum Download aller Events als JSON

### Verwendung der SecurityMonitor Klasse

```typescript
// Event loggen
SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Quiz wurde gestartet', {
  userId: 123,
  timestamp: Date.now(),
});

// Events abrufen
const allEvents = SecurityMonitor.getEvents();
const criticalEvents = SecurityMonitor.getEventsByLevel(SecurityLevel.CRITICAL);
const recentEvents = SecurityMonitor.getRecentEvents(10);

// Events exportieren
const auditLog = SecurityMonitor.exportEvents();

// Zusammenfassung abrufen
const summary = SecurityMonitor.getSummary();
```

---

## 🚦 Rate Limiting

Schutz vor Missbrauch durch Anfragebegrenzung.

### Client-seitige Rate Limiting

```typescript
// Standardkonfiguration
MAX_REQUESTS = 10
WINDOW_MS = 60000 (1 Minute)

// Prüfung
if (!RateLimiter.isAllowed(identifier)) {
  throw new Error('Rate limit exceeded');
}
```

### Server-seitige Rate Limiting

```typescript
// In /api/submit/route.ts
MAX_REQUESTS = 5 pro Session
WINDOW_MS = 60000 (1 Minute)

// Automatische Blockierung bei Überschreitung
Response: 429 Too Many Requests
```

---

## 🔐 Input-Validierung

Schutz vor ungültigen oder schädlichen Eingaben.

### Validierungsfunktionen

```typescript
// Selections validieren
InputValidator.validateSelections(selections);

// String bereinigen
const clean = InputValidator.sanitizeString(userInput);
```

---

## 🌐 HTTP Security Headers

Alle API-Routen setzen die folgenden Sicherheitsheader:

```typescript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'"
}
```

### Header-Erklärungen

- **X-Content-Type-Options**: Verhindert MIME-Type-Sniffing
- **X-Frame-Options**: Schützt vor Clickjacking
- **X-XSS-Protection**: Aktiviert XSS-Filter im Browser
- **Strict-Transport-Security**: Erzwingt HTTPS
- **Content-Security-Policy**: Beschränkt Ressourcenquellen

---

## 📊 Audit-API

Zugriff auf Sicherheitsaudit-Logs (erfordert API-Schlüssel).

### Endpoints

#### GET `/api/audit`

Ruft Audit-Zusammenfassung ab.

**Headers:**

```
X-API-KEY: your-api-key
```

**Response:**

```json
{
  "totalSubmissions": 100,
  "averageScore": 75.5,
  "recentSubmissions": [...],
  "uniqueSessions": 50,
  "dateRange": {
    "earliest": "2025-01-01T00:00:00Z",
    "latest": "2025-11-02T00:00:00Z"
  }
}
```

#### DELETE `/api/audit`

Löscht alle Audit-Logs.

**Headers:**

```
X-API-KEY: your-api-key
```

---

## ⚙️ Konfiguration

### Umgebungsvariablen

Erstellen Sie eine `.env.local` Datei:

```bash
# API-Schlüssel für Audit-Zugriff
API_KEY=ihr-sicherer-api-schlüssel

# Optional: Weitere Konfigurationen
NODE_ENV=production
```

### API-Schlüssel generieren

```bash
# Sicheren API-Schlüssel generieren
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 Verwendungsbeispiele

### 1. Sichere Session initialisieren

```typescript
import { SecureApiClient } from '@/lib/secure-api-client';

// Session initialisieren
await SecureApiClient.initializeSession();
```

### 2. Fragen sicher laden

```typescript
// Fragen abrufen (automatisch verschlüsselt)
const data = await SecureApiClient.fetchQuestions();
```

### 3. Antworten sicher übermitteln

```typescript
const selections = { 1: 0, 2: 1, 3: 2 };
const result = await SecureApiClient.submitAnswers(selections);
```

### 4. Security-Status prüfen

```typescript
const summary = SecureApiClient.getSecuritySummary();
console.log('Verschlüsselung aktiv:', summary.hasEncryptionKey);
console.log('Security Events:', summary.securityEvents);
```

### 5. Session bereinigen

```typescript
// Nach Quiz-Ende
SecureApiClient.clearSession();
```

---

## 📈 Monitoring Best Practices

### Empfohlene Überwachung

1. **Kritische Events regelmäßig prüfen**

   ```typescript
   const critical = SecurityMonitor.getEventsByLevel(SecurityLevel.CRITICAL);
   if (critical.length > 0) {
     // Benachrichtigung senden
   }
   ```

2. **Audit-Logs exportieren**
   - Täglich: Für reguläre Überprüfung
   - Bei Vorfällen: Für forensische Analyse

3. **Rate-Limiting überwachen**
   - Überprüfen Sie `RATE_LIMIT_EXCEEDED` Events
   - Passen Sie Limits bei Bedarf an

4. **Verschlüsselungsstatus überwachen**
   - Stellen Sie sicher, dass Verschlüsselung immer aktiv ist
   - Prüfen Sie Integritätsfehler

---

## 🛠️ Entwicklung

### Tests ausführen

```bash
npm test
```

### Sicherheitstest

```bash
# Rate Limiting testen
# Senden Sie mehrere Anfragen schnell hintereinander

# Verschlüsselung testen
# Überprüfen Sie SessionStorage nach Quiz-Start
```

### Debugging

Setzen Sie `NODE_ENV=development` für ausführliche Konsolen-Logs:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[SECURITY]', event);
}
```

---

## 📋 Checkliste für Produktion

- [ ] API-Schlüssel in `.env.local` setzen
- [ ] HTTPS erzwingen
- [ ] Rate-Limits konfigurieren
- [ ] Security Headers verifizieren
- [ ] Audit-Logs regelmäßig prüfen
- [ ] Backup-Strategie für Audit-Daten
- [ ] Incident-Response-Plan erstellen
- [ ] Security-Dashboard überwachen

---

## 🔄 Updates und Wartung

### Verschlüsselungsschlüssel rotieren

```typescript
// Session-Schlüssel werden automatisch pro Session generiert
// Für langfristige Schlüssel: Implementieren Sie Key-Rotation
```

### Audit-Log-Archivierung

```bash
# Alte Logs archivieren (monatlich)
curl -H "X-API-KEY: your-key" http://localhost:3000/api/audit > audit-backup-$(date +%Y-%m).json
```

---

## ⚠️ Wichtige Sicherheitshinweise

1. **Niemals Verschlüsselungsschlüssel hardcoden**
2. **API-Schlüssel geheim halten**
3. **Regelmäßige Sicherheitsupdates durchführen**
4. **Audit-Logs regelmäßig überprüfen**
5. **Bei verdächtigen Aktivitäten sofort reagieren**
6. **Sicherheitsrichtlinien dokumentieren**

---

## 📞 Support

Bei Sicherheitsproblemen oder Fragen:

1. Überprüfen Sie die Security-Dashboard
2. Exportieren Sie Audit-Logs
3. Konsultieren Sie diese Dokumentation
4. Kontaktieren Sie das Sicherheitsteam

---

## 📚 Weitere Ressourcen

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

**Version**: 1.0.0
**Letzte Aktualisierung**: 2. November 2025
