import strings from '../../data/strings/en.json';

export function App() {
  return (
    <main className="scaffold">
      <h1>{strings['app.title']}</h1>
      <p className="scaffold-note">{strings['app.workingTitleNote']}</p>
      <p>{strings['app.tagline']}</p>
      <p className="scaffold-status">{strings['app.scaffoldStatus']}</p>
    </main>
  );
}
