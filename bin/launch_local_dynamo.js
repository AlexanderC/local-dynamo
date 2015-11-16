// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview The script to launch DynamoDB Local from command line.
 */

var flags = require('flags');
var localDynamo = require('../lib/launch.js');
var hasStartedMsg = false;

flags.defineString('database_dir', '', 'The location for databases files. Run in memory if omitted.');
flags.defineNumber('port', 4567, 'A port to run DynamoDB Local');
flags.parse();

try {
  var childProcess = localDynamo.launch({
    dir: flags.get('database_dir') || null,
    stdio: 'pipe',
  }, flags.get('port'));

  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);

  childProcess.on('error', function (e) {
    if (e.code === 'ENOENT') {
      console.error('Failed to start DynamoDB Local. Maybe because the database directory does not exist.');
    } else {
      console.error('Failed to start DynamoDB Local. Error:', e.message);
    }
  });

  childProcess.stdout.on('data', function(data) {
    if (data.toString() && !hasStartedMsg) {
      hasStartedMsg = true;

      console.log('Local DynamoDB has successfully started!');
    }
  });
} catch(error) {
  console.error(error.toString());
  process.exit(1);
}
