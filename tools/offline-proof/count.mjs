// Reads the request count of a running counter proxy (contracts/http-serving.md §Files).
// Connects to COUNT_SOCKET, prints the integer and a newline, exits 0. Exits 1 with no output
// when the socket is missing or the proxy does not answer.
import { connect } from 'node:net';

const COUNT_SOCKET = process.env.COUNT_SOCKET ?? '/tmp/counter.sock';

const socket = connect(COUNT_SOCKET);
let data = '';
socket.setEncoding('utf8');
socket.on('data', (chunk) => {
  data += chunk;
});
socket.on('error', () => {
  process.exitCode = 1;
});
socket.on('end', () => {
  if (/^\d+\n$/.test(data)) {
    process.stdout.write(data);
  } else {
    process.exitCode = 1;
  }
});
