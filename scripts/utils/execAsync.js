// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process');

function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}
module.exports = execAsync;
