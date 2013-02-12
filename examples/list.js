var zookeeper = require('../index.js');

var client = zookeeper.createClient(
    process.argv[2] || 'localhost:2181',
    {
        timeout : 30000,
        spinDelay : 1000
    }
);

var path = process.argv[3];
var watcherRegistered = false;


function listChildren(client, path) {
    var watcher = null;

    if (!watcherRegistered) {
        watcher = function (event) {
            console.log('Got event: %s', event);
            watcherRegistered = false;
            listChildren(client, path);
        };
    }

    client.getChildren(
        path,
        watcher,
        function (error, children, stat) {
            if (error) {
                console.log('Got error when listing children:');
                console.log(error.stack);
                return;
            }

            watcherRegistered = true;
            console.log('Children of %s: %j', path, children);
        }
    );
}

client.on('state', function (state) {
    console.log('Client state changed to: ' + state);
    if (state === zookeeper.State.SYNC_CONNECTED) {
        console.log('Connected to the server.');
        listChildren(client, path);
    }
});

client.on('error', function (error) {
    console.log('Got error: ' + error);
});


//client.addAuthInfo('blah', new Buffer('127.0.0.1'));
client.connect();
