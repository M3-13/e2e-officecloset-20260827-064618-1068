import type { CSSProperties } from 'react';

const section: CSSProperties = {
  marginBottom: 'var(--space-5)',
};

const muted: CSSProperties = {
  color: 'var(--color-muted)',
};

export default function PrivacyPage() {
  return (
    <article style={{ maxWidth: 720 }}>
      <h1>Datenschutzerklärung</h1>

      <section style={section}>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        </p>
        <p>
          Vestiaire GmbH
          <br />
          Musterstraße 12
          <br />
          10115 Berlin
          <br />
          Deutschland
          <br />
          E-Mail: <a href="mailto:datenschutz@vestiaire.example">datenschutz@vestiaire.example</a>
        </p>
      </section>

      <section style={section}>
        <h2>2. Allgemeine Hinweise</h2>
        <p>
          Wir behandeln Ihre personenbezogenen Daten vertraulich und
          entsprechend der gesetzlichen Datenschutzvorschriften (insbesondere
          der Datenschutz-Grundverordnung, DSGVO) sowie dieser
          Datenschutzerklärung. Die Nutzung unserer Website ist grundsätzlich
          ohne Angabe personenbezogener Daten möglich. Für die Nutzung der
          Anwendung (Registrierung und Verwaltung Ihrer Garderobe) ist jedoch
          die Verarbeitung der nachfolgend beschriebenen Daten erforderlich.
        </p>
      </section>

      <section style={section}>
        <h2>3. Welche Daten wir speichern</h2>
        <p>Bei der Nutzung von Vestiaire verarbeiten wir die folgenden Daten:</p>
        <ul>
          <li>
            <strong>E-Mail-Adresse:</strong> Sie dient als Anmeldename und wird
            zur Kommunikation mit Ihnen verwendet (Art. 6 Abs. 1 lit. b DSGVO).
          </li>
          <li>
            <strong>Passwort:</strong> Ihr Passwort wird niemals im Klartext
            gespeichert. Wir speichern ausschließlich einen kryptografischen
            Hash-Wert (BCrypt), aus dem sich das Passwort nicht zurückrechnen
            lässt.
          </li>
          <li>
            <strong>Garderobendaten:</strong> Name, Kategorie, Farbe und
            Bild-URL der von Ihnen angelegten Kleidungsstücke sowie die von
            Ihnen erstellten Outfits und deren Zusammenstellung.
          </li>
        </ul>
      </section>

      <section style={section}>
        <h2>4. Zweck und Rechtsgrundlage der Verarbeitung</h2>
        <p>
          Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags und zur
          Bereitstellung der Funktionen der Anwendung (Art. 6 Abs. 1 lit. b
          DSGVO). Die Daten werden ausschließlich für diese Zwecke verwendet und
          nicht an Dritte weitergegeben, sofern keine gesetzliche Verpflichtung
          besteht.
        </p>
      </section>

      <section style={section}>
        <h2>5. Speicherdauer</h2>
        <p>
          Ihre Daten werden gespeichert, solange Ihr Konto besteht. Wenn Sie Ihr
          Konto löschen, werden Ihre E-Mail-Adresse, der Passwort-Hash sowie
          sämtliche Garderoben- und Outfit-Daten dauerhaft und vollständig aus
          der Datenbank entfernt.
        </p>
      </section>

      <section style={section}>
        <h2>6. Hosting und Datenübermittlung</h2>
        <p>
          Die Anwendung wird auf Servern innerhalb der Europäischen Union
          betrieben. Es werden keine Drittanbieter-Ressourcen (Schriften,
          Skripte oder Tracking-Dienste) geladen. Eine Übermittlung
          personenbezogener Daten in Drittländer findet nicht statt.
        </p>
      </section>

      <section style={section}>
        <h2>7. Ihre Rechte als betroffene Person</h2>
        <p>Sie haben gegenüber uns folgende Rechte:</p>
        <ul>
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
          <li>Recht auf Löschung (Art. 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Darüber hinaus haben Sie das Recht, sich bei einer
          Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer
          personenbezogenen Daten durch uns zu beschweren (Art. 77 DSGVO).
        </p>
      </section>

      <section style={section}>
        <h2>8. Kontakt zum Datenschutz</h2>
        <p>
          Bei Fragen zur Erhebung, Verarbeitung oder Nutzung Ihrer
          personenbezogenen Daten erreichen Sie uns unter{' '}
          <a href="mailto:datenschutz@vestiaire.example">datenschutz@vestiaire.example</a>.
        </p>
      </section>

      <p style={muted}>Stand: August 2026</p>
    </article>
  );
}
