import type { CSSProperties } from 'react';

const section: CSSProperties = {
  marginBottom: 'var(--space-5)',
};

const muted: CSSProperties = {
  color: 'var(--color-muted)',
};

export default function ImpressumPage() {
  return (
    <article style={{ maxWidth: 720 }}>
      <h1>Impressum</h1>

      <section style={section}>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          Vestiaire GmbH
          <br />
          Musterstraße 12
          <br />
          10115 Berlin
          <br />
          Deutschland
        </p>
      </section>

      <section style={section}>
        <h2>Vertreten durch</h2>
        <p>Geschäftsführung: Anna Muster</p>
      </section>

      <section style={section}>
        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href="mailto:kontakt@vestiaire.example">kontakt@vestiaire.example</a>
          <br />
          Telefon: +49 (0)30 0000000
        </p>
      </section>

      <section style={section}>
        <h2>Registereintrag</h2>
        <p>
          Eintragung im Handelsregister.
          <br />
          Registergericht: Amtsgericht Berlin-Charlottenburg
          <br />
          Registernummer: HRB 000000
        </p>
      </section>

      <section style={section}>
        <h2>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE000000000</p>
      </section>

      <section style={section}>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          Anna Muster
          <br />
          Musterstraße 12
          <br />
          10115 Berlin
        </p>
      </section>

      <section style={section}>
        <h2>EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          . Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section style={section}>
        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
          §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
          Nutzung von Informationen nach den allgemeinen Gesetzen bleiben
          hiervon unberührt.
        </p>
      </section>

      <section style={section}>
        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich.
        </p>
      </section>

      <p style={muted}>Stand: August 2026</p>
    </article>
  );
}
