const nmfFile = require('./lib/my-native-client-app.nmf');

const expected = `data:application/json,{"program":{"x86-64":{"url":"/my-public-path/runnable-ld.c06529.so"},"x86-32":{"url":"/my-public-path/runnable-ld.b52c56.so"}},"files":{"main.nexe":{"x86-64":{"url":"/my-public-path/pi_generator_x86_64.8c6467.nexe"},"x86-32":{"url":"/my-public-path/pi_generator_x86_32.faf6b3.nexe"}},"libppapi_cpp.so":{"x86-64":{"url":"/my-public-path/libppapi_cpp.b8a2e7.so"},"x86-32":{"url":"/my-public-path/libppapi_cpp.899f61.so"}}}}`;

if (nmfFile === expected) {
  console.log('TEST OK');
  global.process.exit(0);
} else {
  console.log('TEST FAILED');
  console.log('expected', expected);
  console.log('got', nmfFile);
  global.process.exit(1);
}
