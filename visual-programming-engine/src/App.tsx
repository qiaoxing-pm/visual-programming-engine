import Demo from './demo_2/index.tsx'


function App() {
  return (
    <div className="page">
      <aside className="left-toolbar" aria-label="操作栏">
        <div className="left-toolbar__title">操作栏</div>
        <button type="button" className="left-toolbar__action">新建</button>
        <button type="button" className="left-toolbar__action">保存</button>
        <button type="button" className="left-toolbar__action">撤销</button>
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
