import { Window } from '../Window';
import { PixelIcon } from '../PixelIcon';

const KEYS: [string, string][] = [
  ['WASD / ↑↓←→', 'Walk (or click the floor)'],
  ['E / Space', 'Use what’s in front of you'],
  ['Click', 'Walk to & use a spot, or meet a person'],
  ['Q / R', 'Rotate the camera'],
  ['+ / − / wheel', 'Zoom (pixel size)'],
  ['F', 'Start / pause focus timer'],
  ['G', 'Walk to your desk'],
  ['T', 'Tasks'],
  ['M', 'Music on/off'],
  ['Enter', 'Chat'],
  ['Esc', 'Close a window'],
];

const SPOTS: [string, string, string][] = [
  ['desk', 'Desks', 'Sit at any free desk to claim it and open BrewOS — your timer, tasks, planner, journal and notes.'],
  ['coffee', 'Espresso bar', 'Order drinks with tickets. Each gives a 1-hour boost to focus tickets.'],
  ['snack', 'Vending machine', 'Snacks, sodas and fortune cookies.'],
  ['book', 'Library', 'Browse Project Gutenberg classics and read them right here. Finishing a book pays tickets.'],
  ['board', 'Whiteboard', 'Kanban view of your tasks.'],
  ['printer', 'Copier', 'Print a daily plan, weekly focus report or poster.'],
  ['water', 'Water cooler', 'Hydration tracker, room chat and the community notes board.'],
  ['music', 'Record player', 'Pick a lo-fi station and mix ambience (rain, café, fire…).'],
  ['joystick', 'Arcade', 'Break-time mini games.'],
  ['shirt', 'Wardrobe', 'Change your look.'],
  ['paw', 'Pet corner', 'Adopt and name companions.'],
  ['door', 'Door', 'Room lobby: 9 themed rooms × 3 servers (Silicon, Haven, Sakura).'],
];

export default function HelpPanel() {
  return (
    <Window title="How CoworkingBrew works" icon="help" width="lg">
      <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
        <section>
          <h3 className="font-semibold text-[14px] mb-2">The loop</h3>
          <ol className="flex flex-col gap-1.5 list-decimal pl-5">
            <li>Grab a free desk (click it or press <span className="px-kbd">G</span>).</li>
            <li>Pick a task and start a 25-minute focus session.</li>
            <li>Your avatar types away with a timer bubble everyone can see.</li>
            <li>Session done → chime + tickets. Take a break: coffee, arcade, a book.</li>
            <li>Spend tickets on drinks, outfits, pets and desk decor.</li>
          </ol>
          <h3 className="font-semibold text-[14px] mt-4 mb-2">Controls</h3>
          <ul className="flex flex-col gap-1">
            {KEYS.map(([k, d]) => (
              <li key={k} className="flex items-center gap-2"><span className="px-kbd shrink-0">{k}</span>{d}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-[14px] mb-2">Around the café</h3>
          <ul className="flex flex-col gap-2">
            {SPOTS.map(([icon, name, d]) => (
              <li key={name} className="flex gap-2"><PixelIcon name={icon} size={20} className="shrink-0" /><span><b>{name}</b> — {d}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </Window>
  );
}
