import type { DragEvent } from "react";
import Demo from './demo_2/index.tsx'
import ImportXML from './components/ImportXML.tsx'
const NODE_TEMPLATE_DRAG_MIME = "application/x-vpe-node-template";
const NODE_TEMPLATES = ["PID", "FORK", "PID_FAST", "PID_SAFE"] as const;

function App() {
  const handleTemplateDragStart = (evt: DragEvent<HTMLButtonElement>, template: string) => {
    evt.dataTransfer.setData(NODE_TEMPLATE_DRAG_MIME, template);
    evt.dataTransfer.setData("text/plain", template);
    evt.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="page">
      <aside className="left-toolbar" aria-label="操作栏">
        <div className="left-toolbar__title">操作栏</div>
        {/* <button

          className="left-toolbar__action left-toolbar__action--draggable"
        >载入
          <input className="input-file" ></input>
        </button> */}
        <ImportXML />
        <div className="left-toolbar__title">可拖拽节点</div>
        {NODE_TEMPLATES.map((template) => (
          <button
            key={template}
            type="button"
            className="left-toolbar__action left-toolbar__action--draggable"
            draggable
            onDragStart={(evt) => handleTemplateDragStart(evt, template)}
          >
            {template}
          </button>
        ))}
      </aside>
      <main className="editor-shell">
        <div className="editor-shell__title">Editor</div>
        <div className="editor-shell__content">
          <Demo />
        </div>
      </main>
    </div>
  )
}

export default App
