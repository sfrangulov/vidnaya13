function shell_exec(cmd, cb) {
    var util = require('util'),
        exec = require('child_process').exec,
        child;
    child = exec(cmd,
        function(err, stdout, stderr) {
            if (err == null) {
                cb(stdout);
            }
        });
    cb('');
}

function pg_insert(title, value, source) {
    var pg = require('pg');

    var conString = "postgres://postgres:postgres@localhost/vidnaya13";

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            return;
        }
        client.query('INSERT INTO measurements(title, value, source) VALUES($1, $2, $3);', [title, value, source],
            function(err, result) {
                client.end();
            });
    });
}

shell_exec('/usr/local/bin/pcsensor -n2 -c', function(ret) {
    if (ret != '') {
        var t0 = ret.split('\n')[0].split(' ')[3].replace('C', '');
        var t1 = ret.split('\n')[1].split(' ')[3].replace('C', '');
        pg_insert('t0', t0, 'vidnaya13x.temper');
        pg_insert('t1', t1, 'vidnaya13x.temper');
    }
});

shell_exec('upsc ups@localhost', function(ret) {
    if (ret != '') {
        var arr = ret.split('\n');
        var row;
        for (var i = 1; i<arr.length - 1; i++) {
            row = arr[i].split(': ');
            if (row[0] == 'input.voltage' || row[0] == 'battery.voltage' || row[0] == 'ups.status')
                pg_insert(row[0], row[1], 'vidnaya13x.ups');
        }
    }
});
