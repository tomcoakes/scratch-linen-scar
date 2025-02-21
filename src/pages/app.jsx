function App() {
  return (
    <div>
      <h1>Hello from an external JSX file!</h1>
      <p>This is a test of using a separate JSX file with Babel.</p>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
