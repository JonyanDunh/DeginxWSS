var ws = require("nodejs-websocket")
var md5 = require('md5-node');
var services = new Object();
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
var server = ws.createServer(function(conn) {
    group = conn.path.split('/')[1];
    uuid = conn.path.split('/')[2];
    key = conn.path.split('/')[3];
    check_id(uuid, key, group, function(result) {
        if (result.length == 0) {
            conn.send(output_log(conn.socket.remoteAddress, 403, "连接失败!原因：身份验证失败!请检查UUID或KEY的正确性"));
            logger.log(output_log(conn.socket.remoteAddress, 403, "连接失败!原因：身份验证失败!请检查UUID或KEY的正确性"))
            conn.close();
        } else {
            conn.send(output_log(conn.socket.remoteAddress, 200, "身份验证成功!", uuid));
            logger.log(output_log(conn.socket.remoteAddress, 200, "身份验证成功!", uuid));
            conn.info = {
                'uuid': uuid,
                'group': group
            };
            if (!(group in services)) {
                services[group] = {}
            }
            services[group][uuid] = {
                'ws': conn
            };
            conn.on("text", function(json) {
                Object.assign(conn.info, JSON.parse(json))
                send_msg(conn)
            })

        }
    })

    conn.on("close", function(code, reason) {
        if ("info" in conn) {
            if ("uuid" in conn.info) {
                logger.log(output_log(conn.socket.remoteAddress, code, "断开连接!", conn.info.uuid));
                delete services[conn.info.group][conn.info.uuid];
                if (Object.keys(services[conn.info.group]).length == 0)
                    delete services[conn.info.group];
            } else {
                logger.log(output_log(conn.socket.remoteAddress, code, "断开连接!"));
            }
        } else {
            logger.log(output_log(conn.socket.remoteAddress, code, "断开连接!", null));
        }
    })
}).listen(10086)

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
    if (conn.info.action != "none") {
        var sender_uuid = conn.info.uuid;
        var sender_IpAddress = conn.socket.remoteAddress;
        var sender_group = conn.info.group;
        var recipient_group = conn.info.send_msg.recipient_group;
        var content = conn.info.send_msg.msg_content;
        switch (conn.info.action) {
            case "send_msg_to_group":
                if (recipient_group in services) {
                    for (let uuid in services[recipient_group]) {
                        services[recipient_group][uuid].ws.send(output_log(sender_IpAddress, 200, "接收数据成功!", sender_uuid, sender_group, content, recipient_group))
                    }
                    conn.send(output_log(sender_IpAddress, 200, "发送数据成功!"));
                    logger.log(output_log(sender_IpAddress, 200, "发送数据成功!", sender_uuid, sender_group, content, recipient_group));
                } else {
                    conn.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));
                    logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group));
                }
                break;
            case "send_msg_to_uuid":
                var recipient_uuid = conn.info.send_msg.recipient_uuid;
                var recipient_IpAddress = services[recipient_group][recipient_uuid].ws.socket.remoteAddress;
                if (recipient_group in services) {
                    recipient_uuid_str = "UUID:{" + recipient_uuid + "}";
                    if (recipient_uuid in services[recipient_group]) {

                        services[recipient_group][recipient_uuid].ws.send(output_log(sender_IpAddress, 200, "接收数据成功!", sender_uuid, sender_group, content, recipient_group, recipient_uuid, recipient_IpAddress))

                        logger.log(output_log(sender_IpAddress, 200, "发送数据成功!", sender_uuid, sender_group, content, recipient_group, recipient_uuid, recipient_IpAddress));
                        conn.send(output_log(sender_IpAddress, 200, "发送数据成功!"));
                    } else {

                        logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group, recipient_uuid));
                        conn.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));

                    }
                } else {
                    logger.log(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!", sender_uuid, sender_group, content, recipient_group));
                    conn.send(output_log(sender_IpAddress, 404, "发送数据失败!接收端不在线或信息有误!"));
                }
                break;
        }
    }
}

function check_id(uuid, key, group, callback) {
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
        callback(result)
    });
    connection.end();
}
process.on('uncaughtException', function(err) {
    //打印出错误
    logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + err);
});