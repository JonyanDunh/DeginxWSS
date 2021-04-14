const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const server = http.createServer();
const fs = require("fs");
const chinaTime = require('china-time');
const {
    Console
} = require('console');
const output = fs.createWriteStream('./log.log', {
    flags: 'a'
});
const errOutput = fs.createWriteStream('./err.log', {
    flags: 'a'
});
const logger = new Console({
    stdout: output,
    stderr: errOutput
});
const wss = new WebSocket.Server({
    noServer: true
});
var md5 = require('md5-node');
var services = new Object();
server.on('upgrade', function upgrade(request, socket, head) {
    authenticate(request, function(err, client) {
        if (err) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            logger.log(output_log(request.socket.remoteAddress, 401, "连接失败!原因：认证失败!"))
            return;
        }
        logger.log(output_log(request.socket.remoteAddress, 200, "连接成功!", client.uuid));
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request, client);
        });

    });
}).listen(10086);
wss.on('connection', function connection(ws, request, client) {
    if (!(client.group in services)) {
        services[client.group] = {}
    }
    services[client.group][client.uuid] = {
        'ws': ws
    };
    ws.on('message', function message(msg) {
        Object.assign(client, JSON.parse(msg))
        Object.assign(ws, client)
        if (client.action != "none") {
            var sender_uuid = client.uuid;
            var sender_IpAddress = request.socket.remoteAddress;
            var sender_group = client.group;
            var recipient_group = client.send_msg.recipient_group;
            var content = client.send_msg.msg_content;
            switch (client.action) {
                case "send_msg_to_group":
                    if (recipient_group in services) {
                        for (let uuid in services[recipient_group]) {
                            if (client.direct == "true")
                                services[recipient_group][uuid].ws.send(content);
                            else
                                services[recipient_group][uuid].ws.send(output_log(sender_IpAddress, 200, "接收数据成功!", sender_uuid, sender_group, content, recipient_group))
                        }
                        ws.send(output_log(sender_IpAddress, 200, "发送数据成功!"));
                        logger.log(output_log(sender_IpAddress, 200, "发送数据成功!", sender_uuid, sender_group, content, recipient_group));
                    } else {
                        ws.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));
                        logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group));
                    }
                    break;
                case "send_msg_to_uuid":
                    var recipient_uuid = client.send_msg.recipient_uuid;
                    var recipient_IpAddress = services[recipient_group][recipient_uuid].ws.socket.remoteAddress;
                    if (recipient_group in services) {
                        recipient_uuid_str = "UUID:{" + recipient_uuid + "}";
                        if (recipient_uuid in services[recipient_group]) {
                            if (client.direct == "true")
                                services[recipient_group][uuid].ws.send(content);
                            else
                                services[recipient_group][recipient_uuid].ws.send(output_log(sender_IpAddress, 200, "接收数据成功!", sender_uuid, sender_group, content, recipient_group, recipient_uuid, recipient_IpAddress))

                            logger.log(output_log(sender_IpAddress, 200, "发送数据成功!", sender_uuid, sender_group, content, recipient_group, recipient_uuid, recipient_IpAddress));
                            ws.send(output_log(sender_IpAddress, 200, "发送数据成功!"));
                        } else {

                            logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group, recipient_uuid));
                            ws.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));

                        }
                    } else {
                        logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group));
                        ws.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));
                    }
                    break;
            }
        }
        ws.on("close", function(code, reason) {
            logger.log(output_log(request.socket.remoteAddress, code, reason, client.uuid));
            delete services[client.group][client.uuid];
            if (Object.keys(services[client.group]).length == 0)
                delete services[client.group];
        })
        // console.log(`Received message ${msg} from user ${client.uuid}`);
    });
});

function output_log(ip, code, msg, uuid, group, content, recipient_group, recipient_uuid, recipient_IpAddress) {
    log = {};
    log.time = chinaTime('YYYY-MM-DD HH:mm:ss');
    log.code = code;
    log.msg = msg;
    log.sender_IpAddress = ip;
    log.sender_uuid = uuid;
    log.sender_group = group;
    log.recipient_IpAddress = recipient_IpAddress;
    log.recipient_uuid = recipient_uuid;
    log.recipient_group = recipient_group;
    log.content = content;
    return JSON.stringify(log);
}

function send_msg(conn) {
    if (client.action != "none") {
        var sender_uuid = client.uuid;
        var sender_IpAddress = ws.socket.remoteAddress;
        var sender_group = client.group;
        var recipient_group = client.send_msg.recipient_group;
        var content = client.send_msg.msg_content;
        switch (client.action) {
            case "send_msg_to_group":
                if (recipient_group in services) {
                    for (let uuid in services[recipient_group]) {
                        if (client.direct == "true")
                            services[recipient_group][uuid].ws.send(content);
                        else
                            services[recipient_group][uuid].ws.send(output_log(sender_IpAddress, 200, "接收数据成功!", sender_uuid, sender_group, content, recipient_group))
                    }
                    ws.send(output_log(sender_IpAddress, 200, "发送数据成功!"));
                    logger.log(output_log(sender_IpAddress, 200, "发送数据成功!", sender_uuid, sender_group, content, recipient_group));
                } else {
                    ws.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));
                    logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group));
                }
                break;
            case "send_msg_to_uuid":
                var recipient_uuid = client.send_msg.recipient_uuid;
                var recipient_IpAddress = services[recipient_group][recipient_uuid].ws.socket.remoteAddress;
                if (recipient_group in services) {
                    recipient_uuid_str = "UUID:{" + recipient_uuid + "}";
                    if (recipient_uuid in services[recipient_group]) {
                        if (client.direct == "true")
                            services[recipient_group][uuid].ws.send(content);
                        else
                            services[recipient_group][recipient_uuid].ws.send(output_log(sender_IpAddress, 200, "接收数据成功!", sender_uuid, sender_group, content, recipient_group, recipient_uuid, recipient_IpAddress))

                        logger.log(output_log(sender_IpAddress, 200, "发送数据成功!", sender_uuid, sender_group, content, recipient_group, recipient_uuid, recipient_IpAddress));
                        ws.send(output_log(sender_IpAddress, 200, "发送数据成功!"));
                    } else {

                        logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group, recipient_uuid));
                        ws.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));

                    }
                } else {
                    logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group));
                    ws.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));
                }
                break;
        }
    }
}

function authenticate(request, callback) {
    var pathname = url.parse(request.url).pathname;
    group = pathname.split('/')[1];
    uuid = pathname.split('/')[2];
    key = pathname.split('/')[3];
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'websocket',
        password: 'zs4EPdz3SSRZezWS',
        database: 'websocket'
    });
    connection.connect();
    var Sql = "SELECT * FROM uuid_list WHERE `uuid_md5`= ? AND `key_md5`= ? AND `group_md5`= ? ";
    var SqlParams = [md5(uuid), md5(key), md5(group)];
    //查
    var results;
    connection.query(Sql, SqlParams, function(err, result) {
        if (err) {
            logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + '[SELECT ERROR] - ', err.message);
            return;
        }
        if (result.length == 0) {
            callback(true)
        } else {
            callback(false, {
                'group': group,
                'uuid': uuid
            })
        }
    });
    connection.end();
}
process.on('uncaughtException', function(err) {
    //打印出错误
    //logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + err);
    logger.log(`<${chinaTime('YYYY-MM-DD HH:mm:ss')}> err:[${err}]`);
});