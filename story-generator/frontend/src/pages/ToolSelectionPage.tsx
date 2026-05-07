import { TOOLS } from '../constants/tools';
import { ToolTile } from '../components/home/ToolTile';

export function ToolSelectionPage() {
  return (
    <main
      id="main-content"
      className="flex-1 overflow-auto bg-canvas"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-semibold text-ink mb-1">
            Welches Tool brauchst du?
          </h1>
          <p className="text-sm text-ink-secondary">
            Wähle ein Tool, um loszulegen.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {TOOLS.map((tool) => (
            <ToolTile key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </main>
  );
}
