let subworker = new Worker('subworker.js', { type: 'module' });

onmessage = (e) => {
  subworker.terminate();
  subworker = new Worker('subworker.js', { type: 'module' });
  subworker.postMessage(e.data);
  subworker.onmessage = (e) => {
    postMessage(e.data);
  };
};
