import { Window } from '../Window';
import { TaskList } from '../os/apps/Tasks';
import { goToMyDesk } from '../HUD';
import { useUI } from '../../state/ui';
import { PixelIcon } from '../PixelIcon';

export default function TasksPanel() {
  return (
    <Window
      title="Tasks"
      icon="check"
      width="md"
      subtitle="Pin a task with 🍅 to focus on it. Completed tasks earn tickets."
      footer={
        <div className="flex gap-2 justify-end">
          <button className="px-btn px-btn-sm" onClick={() => useUI.getState().openPanel('whiteboard')}><PixelIcon name="board" size={14} />Board view</button>
          <button className="px-btn px-btn-sm px-btn-primary" onClick={() => { useUI.getState().closePanel(); goToMyDesk(); }}><PixelIcon name="desk" size={14} />Go to my desk</button>
        </div>
      }
    >
      <TaskList dense />
    </Window>
  );
}
